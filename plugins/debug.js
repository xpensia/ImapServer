
var plugin = module.exports;

plugin.connection = function(connection, next) {
    var stream = connection.stream;
    console.log('[%s:%d] (Connected)', stream.remoteAddress, stream.remotePort);
    stream.on('data', onData.bind({}, stream));
    next();
};

function onData(stream, data) {
    var lines = data.toString('utf8').split('\n');
    if(this.last) {
        lines[0] = this.last+lines[0];
    }
    for(var i=0; i<lines.length-1; i++) {
        console.log('[%s:%d] >>> %s', stream.remoteAddress, stream.remotePort, lines[i].trim());
    }
    this.last = lines[i].trim();
}

plugin.unknown_command = function(connection, line, next) {
    console.log('[%s:%d] Unknown %s :', connection.notes.remoteAddress,
        connection.notes.remotePort, line.command, line.args);
    next(null, 'BAD', 'Unknown command');
};
