
var Server = require('./lib/server.js');

var ImapServer = module.exports = function ImapServer() {
    var server = function ImapServer() {
        server.createConnection.apply(server, arguments);
    };
    server.__proto__ = Server.prototype;
    Server.apply(server, arguments);
    return server;
};

ImapServer.States = require('./lib/states.js');
