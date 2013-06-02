
var Writable = require('stream').Writable;

function Base64Stream() {
    Writable.call(this);
    this.buf = '';

    this.on('unpipe', this.onUnPipe);
}
module.exports = Base64Stream;
Base64Stream.prototype = Object.create(Writable.prototype);

Base64Stream.prototype._write = function(chunk, encoding, cb) {
    this.buf += chunk.toString('binary');
    var i = this.buf.indexOf('\n');
    while(i != -1) {
        if(this.buf.indexOf('+ ') === 0) {
            this.emit('data', new Buffer(this.buf.slice(2, i).trim(), 'base64'));
        }
        else {
            this.emit('data', new Buffer(this.buf.slice(0, i).trim(), 'base64'));
        }
        this.buf = this.buf.slice(i+1);
        i = this.buf.indexOf('\n');
    }
    cb(null);
};

Base64Stream.prototype.onUnPipe = function(src) {
    if(this.buf) {
        src.unshift(new Buffer(this.buf, 'binary'));
    }
};
