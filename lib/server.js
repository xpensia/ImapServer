
var ImapConnection = require('./connection.js');

var PluginIterator = require('./pluginIterator.js');

function ImapServer(opts) {
    opts = opts || {};
    this.notes = {};
    this.plugins = [];
    this.serverName = opts.name || 'Node ImapServer';
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
    var srv = require('net').createServer(this.createConnection.bind(this));
    return srv.listen.apply(srv, args);
};
