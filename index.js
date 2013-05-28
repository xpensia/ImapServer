
var Server = module.exports = require('./lib/server.js');

Server.States = require('./lib/states.js');

Server.createServer = function createServer() {
    var server = Object.create(Server.prototype);
    Server.apply(server, arguments);
    return server;
};
