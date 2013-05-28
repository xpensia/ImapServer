
exports.loginToAuthPlain = function loginToAuthPlain(line) {
    var saslir = '\u0000'+line.args[0]+'\u0000'+line.args[1];
    line.args = [
        'PLAIN',
        new Buffer(saslir, 'binary').toString('base64')
    ];
};

exports.makeListRegexp = function makeListRegexp(str, delimiter) {
    str = str.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
    str = str.replace(/\*/g, '.*').replace(/%/g, '[^'+delimiter+']*');
    return new RegExp('^'+str+'$');
};
