# ImapServer

IMAP Server module for Nodejs

## Built-in plugins

ImapServer provides some built-in plugins.

```javascript
var plugins = require('imap-server/plugins');

server.use(plugins.announce);
```


### announce

This plugin wellcome the client and announce his capabilities.
It's required by the IMAP spec, but you can implement your own.

### starttls

This plugin provide STARTTLS support.


### debug

This plugin log various information.


## Notes

* Default port : 143
* SSL port : 993
* rfc3501 (IMAP4rev1) : http://tools.ietf.org/html/rfc3501
* return flags : OK, NO, BAD

## Plugins events

* getCapabilities ( connection ) Sync, return [cap, ...]
* register
* connection ( connection, next )
* starttls ( next )
* auth_* ( next )
* unknown_command ( connection, line, next )

## TODOs

### must

* auth workflow
* starttls Plugins

### addons

* SASL-IR : http://tools.ietf.org/html/rfc4959