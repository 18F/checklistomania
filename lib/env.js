var _defaults = require('lodash.defaults');
var _get = require('lodash.get');

var defaults = {
  GITHUB_CLIENT_ID: null,
  GITHUB_CLIENT_SECRET: null,
  GITHUB_ORG: null,
  SESSION_SECRET: null,
  MONGODB_URI: 'mongodb://localhost:27017/checklistomania'
};

function load(_fromEnv) {
  var env = {};
  var credentials;
  var vcapServices;
  var fromEnv = _fromEnv;

  if (!fromEnv) {
    fromEnv = process.env;
  }

  if (fromEnv.VCAP_SERVICES) {
    vcapServices = JSON.parse(fromEnv.VCAP_SERVICES);

    credentials = _get(vcapServices, 'user-provided[0].credentials');

    if (credentials) {
      _defaults(env,
        credentials,
        { MONGODB_URI: _get(vcapServices, 'mongodb26-swarm[0].credentials.uri') });
    }
  } else {
    _defaults(env, fromEnv, defaults);
  }

  return env;
}

module.exports = { load: load };
