var _defaults = require('lodash.defaults');
var _get = require('lodash.get');

// Singleton environment hash
var _env = {};

var defaults = {
  GITHUB_CLIENT_ID: null,
  GITHUB_CLIENT_SECRET: null,
  GITHUB_ORG: null,
  SESSION_SECRET: null,
  MONGODB_URI: 'mongodb://localhost:27017/checklistomania'
};

function load(_fromEnv) {
  var credentials;
  var vcapServices;
  var fromEnv = _fromEnv;
  var keys = Object.keys(_env);
  keys.forEach(function (k) {
    delete _env[k];
  });

  if (!fromEnv) {
    fromEnv = process.env;
  }

  if (fromEnv.VCAP_SERVICES) {
    vcapServices = JSON.parse(fromEnv.VCAP_SERVICES);

    credentials = _get(vcapServices, 'user-provided[0].credentials');

    if (credentials) {
      _defaults(_env,
        credentials,
        { MONGODB_URI: _get(vcapServices, 'mongodb32[0].credentials.uri') });
    }
  } else {
    _defaults(_env, fromEnv, defaults);
  }

  return _env;
}

module.exports = { load: load };
