
var plugin = module.exports = {};

plugin.connection = function(connection, next) {
    var caps = connection.getCapabilities();
    connection.send(null, 'OK', '[CAPABILITY '+caps.join(' ')+'] '+this.serverName+' wellcome you!');
    next();
};
