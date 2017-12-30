var os = require('os');
var path = require('path');
var fs = require('fs');
var parse = require('sshconf/parse');


module.exports = {
  getDefaultSshConfPath: function() {
    return path.join(os.homedir(), '.ssh/config');
  },

  readSshConfig: function(path, callback) {
    var hosts = {};
    var fileStream = fs.createReadStream(path);

    fileStream.on('error', function(err) {
      if (err.code === 'ENOENT') {
        callback(hosts);
      } else {
        throw err;
      }
    });

    var stream = fileStream.pipe(parse());
    stream.on('readable', function() {
      var host = this.read();
      if (host === null) return;

      // Top-level conf options
      if (typeof host['Host'] === 'undefined') {
        host['Host'] = [null];
      }

      host['Host'].forEach(function(hostString) {
        if (typeof host['IdentityFile'] === 'string') {
          var home = os.homedir();
          var identityFile = host['IdentityFile'];
          host['IdentityFile'] = home ? identityFile.replace(/^~($|\/|\\)/, home + '$1') : identityFile;
        }

        hosts[hostString] = Object.assign({}, hosts[hostString], host);
      });
    });

    stream.on('end', function() {
      callback(hosts);
    });
  },

  readDefaultSshConfig: function(callback) {
    this.readSshConfig(this.getDefaultSshConfPath(), callback);
  }
};
