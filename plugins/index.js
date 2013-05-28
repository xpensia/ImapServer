
var plugins = module.exports = {};

Object.defineProperties(plugins, {
    starttls: {
        get: function() {return require('./starttls.js');}
    },
    announce: {
        get: function() {return require('./announce.js');}
    },
    debug: {
        get: function() {return require('./debug.js');}
    }
});
