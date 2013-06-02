# imap-server

IMAP Server module for Nodejs

This project is inspired by [Haraka](http://haraka.github.io/) a SMTP server for Nodejs.
All features of an IMAP server are implemented as plugins, so it can adapt to many use cases.

## Installation

```sh
npm install imap-server
```

## Usage

```javascript
var ImapServer = require('imap-server');
var server = ImapServer();

// use plugin
var plugins = require('imap-server/plugins');
server.use(plugins.announce);
/* use more builtin or custom plugins... */

var net = require('net');
net.createServer(server).listen(process.env.IMAP_PORT || 143);
```

## Plugins

### Built-in plugins

#### announce

Required by [IMAP4rev1][imap]. This plugin also send the optional capability list.

#### starttls

Provide encrypted communication for IMAP via the [STARTTLS][starttls] command.

```javascript
server.use(plugins.starttls, {
    /* mandatory hash of options for crypto.createCredentials
     * http://nodejs.org/api/crypto.html#crypto_crypto_createcredentials_details
     * with at least key & cert
     */
    key: Buffer,
    cert: Buffer
});
```

#### debug

This plugin log various information.

### authentification helper

Here's how to implement auth plain without worrying about the underlying protocol:
```javascript
var WrapAuthPlain = require('imap-server/util/auth_plain_wrapper');

exports.auth_plain = WrapAuthPlain(function(connection, username, password, next) {
    if(username == "john.doe@example.com" && password == "foobar") {
        next(null, 'OK');
    }
    else {
        next(null, 'NO');
    }
});
```

## Notes

* Default port : 143
* SSL port : 993
* rfc3501 (IMAP4rev1) : http://tools.ietf.org/html/rfc3501
* return flags : OK, NO, BAD

* getCapabilities ( connection ) Sync, return [cap, ...]
* register
* connection ( connection, next )
* starttls ( next )
* auth_* ( next )
* unknown_command ( connection, line, next )


[imap]: http://tools.ietf.org/html/rfc3501 "RFC 3501"
[starttls]: http://tools.ietf.org/html/rfc2595 "RFC 2595"
[sasl-ir]: http://tools.ietf.org/html/rfc4959 "RFC 4959"
