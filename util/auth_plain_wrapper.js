
var b64Stream = require('./base64_stream');

function WrapAuthPlain(cb) {
    function auth_plain(connection, data, next) {
        if(data) {
            return onData.call(this, connection, data, next);
        }
        var s = new b64Stream();
        var server = this;
        s.on('data', function(data) {
            connection.stream.unpipe(s);
            onData.call(server, connection, data, next);
        });
        connection.stream.pipe(s);
        connection.stream.write('+ \r\n');
    }
    function onData(connection, data, next) {
        var auth = data.toString('binary', 1).split('\u0000');
        if(auth.length != 2) {
            return next(null, 'BAD', 'Invalid credentials format.');
        }
        cb.call(this, connection, auth[0] || '', auth[1] || '', next);
    }
    return auth_plain;
}
module.exports = WrapAuthPlain;

