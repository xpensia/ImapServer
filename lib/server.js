
var ImapConnection = require('./connection');

var PluginIterator = require('./pluginIterator');

function ImapServer(opts) {
    opts = opts || {};
    this.notes = {};
    this.plugins = [];
    if(opts.name) {
        this.serverName = opts.name;
        delete opts.name;
    }
    else {
        this.serverName = 'Node ImapServer';
    }
    for(var k in opts) {
        this.notes[k] = opts[k];
    }
}
module.exports = ImapServer;

/*
 *  Express style server creation
 */
ImapServer.prototype.bind = Function.prototype.bind;
ImapServer.prototype.call = Function.prototype.call;
ImapServer.prototype.apply = Function.prototype.apply;

/*
 *  Plugins support
 */
ImapServer.prototype.use = function(plugin, opts) {
    this.plugins.push(plugin);
    if(typeof plugin.initialize == 'function') {
        plugin.initialize.call(this, opts);
    }
};

ImapServer.prototype.createConnection = function(stream) {
    return new ImapConnection(this, stream);
};

ImapServer.prototype.getCapabilities = function(connection) {
    var caps = ['IMAP4rev1', 'SASL-IR'];
    for(var i=0; i<this.plugins.length; i++) {
        var getCaps = this.plugins[i].getCapabilities;
        if(typeof getCaps == 'function') {
            caps = caps.concat(getCaps.call(this, connection));
        }
    }
    return caps;
};

ImapServer.prototype.listen = function() {
    var args = Array.prototype.slice.call(arguments);
    if(!args[0] || Number(args[0]) != args[0]) {
        args.unshift(143);
    }
    var srv = require('net').createServer(this.createConnection.bind(this));
    return srv.listen.apply(srv, args);
};
