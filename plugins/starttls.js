
var tls = require('tls');
var crypto = require('crypto');
var emit = require('events').EventEmitter.prototype.emit;

var plugin = module.exports;

plugin.initialize = function(opts) {
    if(!opts || !opts.key || !opts.cert) {
        throw new Error("Can't enable STARTTLS plugin: missing certs configuration");
    }
    else {
        //opts.ciphers = 'ALL';
        this.notes._credentials = crypto.createCredentials(opts);
    }
};

plugin.getCapabilities = function(connection) {
    if(this.notes._credentials) {
        return ['STARTTLS'];
    }
    else {
        return [];
    }
};

var events = ['error', 'close'];

plugin.starttls = function(connection, tag) {
    if(!this.notes._credentials) {
        throw new Error('No credentials available');
    }
    connection.pause();

    var socket = connection.stream;
    socket.ondata = null;
    socket.unpipe();
    var securePair = tls.createSecurePair(this.notes._credentials, true, false, false);
    var clearText = securePair.cleartext;

    for(var i=0; i<events.length; i++) {
        var event = events[i];
        var listeners = (socket.listeners(event) || []).slice(0);
        socket.removeAllListeners(event);
        for(var j=0; j<listeners.length; j++) {
            clearText.on(event, listeners[j]);
            socket.on(event, emit.bind(clearText, event));
        }
    }

    securePair.fd = socket.fd;
    clearText.socket = socket;
    clearText.encrypted = securePair.encrypted;
    clearText.authorized = false;

    securePair.on('error', emit.bind(clearText, 'error'));
    securePair.on('secure', function() {
        var verifyError = (securePair.ssl || securePair._ssl).verifyError();

        // A cleartext stream has the boolean property 'authorized' to determine if it was verified by the CA. If 'authorized' is false, a property 'authorizationError' is set on the stream.
        if (verifyError) {
            clearText.authorized = false;
            clearText.authorizationError = verifyError;
        } else {
            clearText.authorized = true;
        }
        connection.stream = clearText;
        connection.resume();

        connection.callPlugins('secure', [connection]);
    });

    clearText._controlReleased = true;
    socket.pipe(securePair.encrypted);
    socket.write(tag+' OK Begin TLS negotiation now\r\n');
    securePair.encrypted.pipe(socket);
};

