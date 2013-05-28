
var net = require('net');

var ImapConnection = require('./connection.js');

var PluginIterator = require('./pluginIterator.js');

function ImapServer(opts) {
    opts = opts || {};
    this.notes = {};
    this.plugins = [];
    this.name = opts.name || 'Node ImapServer';
}
module.exports = ImapServer;


/*
 *  Plugins support
 */
ImapServer.prototype.use = function(plugin) {
    this.plugins.push(plugin);
    if(typeof plugin.register == 'function') {
        plugin.register.call(this);
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
    var srv = net.createServer(this.createConnection.bind(this));
    return srv.listen.apply(srv, args);
};
