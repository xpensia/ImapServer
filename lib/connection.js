
var EventEmitter = require('events').EventEmitter;
var tls = require('tls');

var Parser = require('imap-parser');

var States = require('./states.js');
var PluginIterator = require('./pluginIterator.js');
var util = require('./util.js');

var TIMEOUT = 30 * 1000;

function ImapConnection(server, stream) {
    EventEmitter.call(this);
    this.server = server;
    this.stream = null;
    this.parser = new Parser();
    this.state = States.NotAuthenticated;
    this.onTimeout = this.onTimeout.bind(this);
    this.timeout = setTimeout(this.onTimeout, TIMEOUT);

    this.notes = {
        remoteAddress: stream.remoteAddress,
        remotePort: stream.remotePort
    };

    this.paused = false;
    this.lineBuffer = [];
    this.continueCb = null;

    this.parser.on('data', this.onLine.bind(this));
    this.setStream(stream);

    // errors
    var c = this;
    this.parser.on('end', this.clean.bind(this, false));
    this.stream.on('error', function(e) {
        c.stream._err = e;
        if(e.code != 'ECONNRESET' && e.code != 'EPIPE') {
            console.log('Unmanaged:', e, '\n', e.stack);
            throw e;
        }
    });
    this.stream.on('close', this.clean.bind(this, true));

    this.callPlugins('connection', [this], true);
}
module.exports = ImapConnection;
ImapConnection.prototype = Object.create(EventEmitter.prototype);

/*
 *  Plugins support
 */
ImapConnection.prototype.getCapabilities = function() {
    return this.server.getCapabilities(this);
};

ImapConnection.prototype.callPlugins = function(hook, params, all, cb) {
    var connection = this;
    connection.pause();
    if(typeof all == 'function') {
        cb = all;
        all = false;
    }
    var iter = PluginIterator.call(this.server, this.server.plugins.slice(0),
        hook, params, all || false, function(err) {
            if(typeof cb == 'function') {
                cb.apply(null, arguments);
            }
            else if(err) {
                console.error('Uncaught plugin error:', err, '\r\n', err.stack);
            }
            process.nextTick(connection.resume.bind(connection));
        });
    process.nextTick(iter);
};


/*
 *  Data receiving
 */
ImapConnection.prototype.continueReq = function(data, cb) {
    var line = '+ ';
    if(typeof data != 'function') {
        line += data.toString();
    }
    else {
        cb = data;
    }
    this.continueCb = cb;
    this.write(line + '\r\n');
    console.log('[%s:%d] <<< %s', this.notes.remoteAddress, this.notes.remotePort, line);
};

ImapConnection.prototype.pause = function() {
    this.stream.unpipe(this.parser);
    this.paused = true;
};

ImapConnection.prototype.resume = function() {
    this.paused = false;
    this.stream.pipe(this.parser);
};

ImapConnection.prototype.onLine = function(line) {
    // timeout reset
    clearTimeout(this.timeout);
    this.timeout = setTimeout(this.onTimeout, TIMEOUT);

    //
    console.log('Received a line!', line);
    var tag = line[0];
    var cmd = (line[1] || '').toUpperCase();
    var args = line.slice(2);
    switch(cmd) {
        case 'CAPABILITY' :
            var caps = this.server.getCapabilities(this);
            this.send(null, 'CAPABILITY', caps.join(' '));
            this.send(tag, 'OK', 'CAPABILITY completed');
            return;
        case 'NOOP':
            this.send(tag, 'OK', 'NOOP completed');
            return;
        case 'LOGOUT':
            this.send(null, 'BYE', 'See you soon!');
            this.send(tag, 'OK', 'LOGOUT completed');
            this.close();
            return;
    }
    if(this.state == States.NotAuthenticated) {
        switch(cmd) {
            case 'STARTTLS':
                this.callPlugins('starttls', [this, tag]);
                return;
            case 'LOGIN':
                if(args.length < 2) {
                    this.send(tag, 'BAD', 'Need a username and password to login');
                    return;
                }
                args = util.loginToAuthPlain(args[0], args[1]);
            case 'AUTHENTICATE':
                if(!args.length) {
                    this.send(tag, 'BAD', 'Need an authentication mechanism to proceed.');
                    return;
                }
                var auth = 'auth_'+args[0].toLowerCase();
                this.callPlugins(auth, [this, args], afterAuthenticate.bind(this, tag));
                return;
            default:
                this.callPlugins('unknown_command', [this, cmd, args], afterCommand.bind(this, tag));
                return;
        }
    }
    if(this.state == States.Authenticated) {
        switch(cmd) {
            case 'EXAMINE':
            case 'CREATE':
            case 'DELETE':
            case 'RENAME':
            case 'SUBSCRIBE':
            case 'UNSUBSCRIBE':
            case 'STATUS':
            case 'APPEND':
            case 'LSUB':
                console.log('Received command:', cmd, args);
                this.send(tag, 'BAD', 'Command not implemented');
                return;
            case 'LIST':
                if(args.length != 2) {
                    this.send(tag, 'BAD', 'LIST needs 2 arguments');
                }
                else {
                    this.callPlugins('list', [this, args[0], args[1]], afterCommand.bind(this, tag));
                }
                return;
            case 'SELECT':
                if(args.length != 1) {
                    this.send(tag, 'BAD', 'SELECT needs a mailbox name');
                }
                else {
                    this.callPlugins('select', [this, args[0]], afterSelect.bind(this, tag));
                }
                return;
            default:
                this.callPlugins('unknown_command', [this, cmd, args], afterCommand.bind(this, tag));
                return;
        }
    }
};

function afterCommand(code, err, res, msg) {
    if(err) {
        this.send(code, 'BAD',  msg || 'Error processing your request.');
        console.error('An error happen:', err, '\r\n', err.stack);
    }
    else if(res == 'OK') {
        this.send(code, 'OK', msg || 'completed.');
    }
    else if(res == 'NO') {
        this.send(code, 'NO', msg || 'action refused.');
    }
    else if(res == 'BAD') {
        this.send(code, 'BAD', msg || 'Client error.');
    }
    else {
        this.send(code, 'BAD', 'Something strange happen.');
        console.error('Plugin send invalid response:', res, msg);
    }
}

function afterAuthenticate(code, err, res, msg) {
    if(res == 'OK') {
        this.state = States.Authenticated;
        this.send(code, 'OK', msg || '[CAPABILITY '+this.getCapabilities().join(' ')+'] Logged in');
    }
    else if(res == 'NO') {
        this.send(code, 'NO', msg || 'Bad username or password.');
    }
    else {
        afterCommand.apply(this, arguments);
    }
}

function afterSelect(code, err, res, msg) {
    if(res == 'OK') {
        this.state = States.Selected;
        this.send(code, 'OK', msg || 'Select completed');
    }
    else if(res == 'NO') {
        this.send(code, 'NO', msg || 'Select failled');
    }
    else {
        afterCommand.apply(this, arguments);
    }
}


/*
 *  Connection state
 */
ImapConnection.prototype.onDisconnect = function() {
    console.log('Client Disconnected');
};

ImapConnection.prototype.onTimeout = function() {
    this.send(null, 'BYE', 'Disconnected for inactivity.');
    this.stream.destroySoon();
};

ImapConnection.prototype.close = function() {
    // TODO
};

ImapConnection.prototype.clean = function(closed, err) {
    clearTimeout(this.timeout);
    if(closed && err) {
        console.log('[%s:%d] Disconnect (%s)', this.notes.remoteAddress, this.notes.remotePort, this.stream._err.code);
    }
    else if(!closed && this.stream.writable) {
        console.log('[%s:%d] Closing connection', this.notes.remoteAddress, this.notes.remotePort);
        this.stream.end();
    }
    else {
        console.log('[%s:%d] Disconnect (OK)', this.notes.remoteAddress, this.notes.remotePort);
    }
    this.stream.unpipe(this.parser);
};

ImapConnection.prototype.send = function(id, cmd, info) {
    var msg = (id?id:'*')+' '+cmd.toUpperCase()+' '+info;
    this.stream.write(msg+'\r\n');
    console.log('[%s:%d] <<< %s', this.notes.remoteAddress, this.notes.remotePort, msg);
};

ImapConnection.prototype.setStream = function(stream) {
    if(this.stream) {
        this.stream.unpipe(this.parser);
        for(var event in this.stream._events) {
            var listeners = this.stream.listeners(event);
            stream._events[event] = listeners.slice(0);
        }
    }
    this.stream = stream;
    if(!this.paused) {
        stream.pipe(this.parser);
    }
};

ImapConnection.prototype.write = function() {
    return this.stream.write.apply(this.stream, arguments);
};

Object.defineProperty(ImapConnection.prototype, 'secure', {
    // TODO : this crash
    get: function() {
        return (this.stream instanceof tls.CleartextStream);
    }
});
