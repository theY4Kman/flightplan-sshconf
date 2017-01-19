# flightplan-sshconf

Avoid hard-coding personal login details in your [Flightplan](https://github.com/pstadler/flightplan) by reading from your SSH config.


## Installation & Usage
```bash
$ npm install flightplan-sshconf
```

```javascript
// flightplan.js
var plan = require('flightplan');
var useSshConf = require('flightplan-sshconf');
useSshConf(plan);
```


## Semantics

Behavior is roughly modeled on [Fabric's](http://docs.fabfile.org/en/1.4.0/usage/execution.html#ssh-config), namely:

 - User, Port, and IdentityFile will fill in missing values of "user", "port", and "privateKey", respectively.
    - If any of these are globally specified (i.e. placed before any Host directive), they will be used as defaults
 - HostName may be used to replace the given "host" value
