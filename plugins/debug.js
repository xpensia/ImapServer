
var Writable = require('stream').Writable;

var plugin = module.exports = {};

function LogStream(addr, port) {
    Writable.call(this);

    this.addr = addr;
    this.port = port;
    this.last = null;
}
LogStream.prototype = Object.create(Writable.prototype);
LogStream.prototype._write = function(chunk, encoding, cb) {
    var lines = chunk.toString('utf8').split('\n');
    if(this.last) {
        lines[0] = this.last+lines[0];
    }
    for(var i=0; i<lines.length-1; i++) {
        console.log('[%s:%d] >>> %s', this.addr, this.port, lines[i].trim());
    }
    this.last = lines[i].trim();
    cb();
};

plugin.connection = function(c, next) {
    var stream = c.stream;
    var log = new LogStream(c.notes.remoteAddress, c.notes.remotePort);
    console.log('[%s:%d] (Connected)', c.notes.remoteAddress, c.notes.remotePort);
    stream.pipe(log);
    next();
};

plugin.secure = function(c, next) {
    var stream = c.stream;
    var log = new LogStream(c.notes.remoteAddress, c.notes.remotePort);
    console.log('[%s:%d] (Secured)', c.notes.remoteAddress, c.notes.remotePort);
    stream.pipe(log);
    next();
};

plugin.unknown_command = function(c, line, next) {
    console.log('[%s:%d] Unknown %s :', c.notes.remoteAddress,
        c.notes.remotePort, line.command, line.args);
    next(null, 'BAD', 'Unknown command');
};
