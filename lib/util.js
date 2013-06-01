
exports.loginToAuthPlain = function loginToAuthPlain(user, pass) {
    var saslir = '\u0000'+user+'\u0000'+pass;
    return [
        'PLAIN',
        new Buffer(saslir, 'binary').toString('base64')
    ];
};

exports.makeListRegexp = function makeListRegexp(str, delimiter) {
    str = str.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
    str = str.replace(/\*/g, '.*').replace(/%/g, '[^'+delimiter+']*');
    return new RegExp('^'+str+'$');
};
