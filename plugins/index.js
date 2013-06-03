
var plugins = module.exports = {};

Object.defineProperties(plugins, {
    starttls: {
        get: function() {return require('./starttls');}
    },
    announce: {
        get: function() {return require('./announce');}
    },
    debug: {
        get: function() {return require('./debug');}
    }
});
