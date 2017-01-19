var extend = require('util-extend');
var sshconf = require('./sshconf');


// Applied to all hosts
var universalSettings = {
  agent: process.env.SSH_AUTH_SOCK,
};


function convertHostToTarget(host) {
  var mapping = {
    'HostName': 'host',
    'User': 'user',
    'Port': 'port',
    'IdentityFile': 'privateKey',
  };

  var target = {};
  for (var key in host) {
    if (!host.hasOwnProperty(key)) continue;

    // Host key not needed in target config
    if (key === 'Host') continue;

    var value = host[key];
    if (mapping.hasOwnProperty(key)) {
      key = mapping[key];
    }

    target[key] = value;
  }

  return target;
}


function fetchTargets(callback) {
  sshconf.readDefaultSshConfig(function(hosts) {
    var targets = {};
    for (var key in hosts) {
      if (hosts.hasOwnProperty(key)) {
        targets[key] = convertHostToTarget(hosts[key]);
      }
    }

    callback(targets);
  });
}


var targetsCache = null;
function getTargets(callback) {
  if (targetsCache == null) {
    fetchTargets(function(targets) {
      targetsCache = targets;
      callback(targets);
    });
  } else {
    callback(targetsCache);
  }
}


function sshConfHosts(hosts) {
  if (!Array.isArray(hosts) && typeof hosts === 'object') {
    hosts = [extend({}, hosts)];
  }

  return function(done) {
    getTargets(function(targets) {
      var filledHosts = hosts.map(function(host) {
        // Can't merge if no host set
        if (host.host == null) {
          return host;
        }

        // Merge in top-level conf, then matching host
        var fromConf = Object.assign({}, universalSettings, targets[null], targets[host.host]);
        var mergedHost = Object.assign({}, fromConf, host);
        if (fromConf.hasOwnProperty('host')) {
          mergedHost.host = fromConf.host;
        }

        return mergedHost;
      });

      done(filledHosts);
    });
  }
}

function useSshConf(flightplan) {
  var origTarget = flightplan.target.bind(flightplan);

  flightplan.target = function(name, hosts, options) {
    var getHosts;
    if (typeof hosts === 'function') {
      getHosts = hosts;
    } else {
      getHosts = function(done) { done(hosts); }
    }

    var decoratedHosts = function(done) {
      getHosts(function(hosts) {
        return sshConfHosts(hosts)(done);
      });
    };

    return origTarget(name, decoratedHosts, options);
  }
}

module.exports = useSshConf;
