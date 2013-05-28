
function ParseResponse() {
    this.tag = null;
    this.command = null;
    this.args = [];
    this.literals = false;
    this.error = false;
}

module.exports = function parse(line) {
    var last = 0, pos;
    var res = new ParseResponse();
    pos = line.indexOf(' ', last);
    if(pos != -1) {
        res.tag = line.slice(last, pos);
        last = pos + 1;
    }
    else {
        res.error = new SyntaxError("Can't parse command tag");
        return res;
    }
    pos = line.indexOf(' ', last);
    if(pos != -1) {
        res.command = line.slice(last, pos).toUpperCase();
        pos++;
    }
    else {
        res.error = new SyntaxError("Can't parse command name");
        return res;
    }
    var arg;
    while(pos < line.length) {
        if(line[pos] == '{') {
            last = pos+1;
            pos = line.indexOf('}', last);
            if(pos != -1 && pos > last) {
                res.literals = Number(line.slice(last, pos));
                if(pos+1 < line.length) {
                    res.error = new SyntaxError("Literal must be last element on a line");
                    return res;
                }
                else {
                    return res;
                }
            }
            else {
                res.error = new SyntaxError("Can't parse literal length");
                return res;
            }
        }
        else if(line[pos] == '"') {
            last = pos+1;
            pos = line.indexOf('"', last);
            if(pos != -1) {
                res.args.push(line.slice(last, pos));
                if(line[pos+1] == ' ') {
                    pos += 2;
                }
                else {
                    pos++;
                }
            }
            else {
                res.error = new SyntaxError("Can't parse quoted string");
                return res;
            }
        }
        else {
            last = pos;
            pos = line.indexOf(' ', last);
            if(pos == -1) {
                pos = line.length;
            }
            arg = line.slice(last, pos);
            if(arg.toUpperCase() == 'NIL') {
                res.args.push(null);
            }
            else {
                res.args.push(arg);
            }
            pos++;
        }
    }
    return res;
};


