
module.exports = function PluginIterator(list, name, args, all, cb) {
    var stack = new Error('Iterator Origin');
    if(!Array.isArray(list)) {
        throw new TypeError('First argument must be an array of plugins');
    }
    if(typeof name != 'string') {
        throw new TypeError('Second argument must be an callback name');
    }
    if(typeof args == 'function') {
        cb = args;
        all = false;
        args = [];
    }

    var server = this;
    var i = -1;
    var res = [];
    function next(err) {
        if(err) {
            if(err instanceof Error) {
                err.stack += '\n-------\n'+stack.stack;
            }
            if(typeof cb == 'function') {
                return cb(err);
            }
            else {
                throw err;
            }
        }
        if(arguments.length > 1) {
            var r = Array.prototype.slice.call(arguments, 1);
            if(all) {
                res.push(r);
            }
            else {
                return cb.apply(null, arguments);
            }
        }
        else if(all && i>=0) {
            res.push([]);
        }
        for(i++; i<list.length; i++) {
            if(typeof list[i] == 'object' && typeof list[i][name] == 'function') {
                process.nextTick(next.apply.bind(list[i][name], server, args.concat(next)));
                return;
            }
        }
        if(typeof cb == 'function') {
            cb(null, res);
        }
    }
    return next;
};
