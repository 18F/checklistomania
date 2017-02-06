/* global describe it expect */
var env = require('../../lib/env');

function makeVcapServicesEnv(vcapServices) {
  return {
    VCAP_SERVICES: JSON.stringify(vcapServices)
  };
}

describe('env properly loads config values', function () {
  it('has default MONGODB_URI', function (done) {
    var e = env.load({});
    expect(e.MONGODB_URI).toBe('mongodb://localhost:27017/checklistomania');
    done();
  });

  it('defaults other required values to null', function (done) {
    var e = env.load({});
    expect(e.GITHUB_CLIENT_ID).toBeNull();
    expect(e.GITHUB_CLIENT_SECRET).toBeNull();
    expect(e.GITHUB_ORG).toBeNull();
    expect(e.SESSION_SECRET).toBeNull();
    done();
  });

  it('loads from the specified env', function (done) {
    var e = env.load({
      SOME_ENV_VAR: 'whatever'
    });
    expect(e.SOME_ENV_VAR).toBe('whatever');
    done();
  });

  it('loads from process.env by default', function (done) {
    var e;
    process.env = {
      ENV_VAR_IN_PROCESS_ENV: 'whatever'
    };
    e = env.load();
    expect(e.ENV_VAR_IN_PROCESS_ENV).toBe('whatever');
    done();
  });

  it('loads from VCAP_SERVICES', function (done) {
    var e = env.load(makeVcapServicesEnv({
      'user-provided': [{
        credentials: {
          GITHUB_CLIENT_ID: 'clientId',
          GITHUB_CLIENT_SECRET: 'clientSecret',
          GITHUB_ORG: 'org',
          SESSION_SECRET: 'sessionSecret'
        }
      }],
      'mongodb32': [{
        credentials: {
          uri: 'mongodb://whatever'
        }
      }]
    }));
    expect(e.GITHUB_CLIENT_ID).toBe('clientId');
    expect(e.GITHUB_CLIENT_SECRET).toBe('clientSecret');
    expect(e.GITHUB_ORG).toBe('org');
    expect(e.SESSION_SECRET).toBe('sessionSecret');
    expect(e.MONGODB_URI).toBe('mongodb://whatever');
    done();
  });
});
