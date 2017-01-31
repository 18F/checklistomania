/* global describe it expect */
var env = require('../../lib/env');

describe('env properly loads config values', function () {
  it('has default MONGODB_URI', function (done) {
    var e = env.load({});
    expect(e.MONGODB_URI).toBe('mongodb://localhost:27017/checklistomania');
    done();
  });

  it('loads from VCAP_SERVICES', function (done) {
    // TODO: load mock VCAP_SERVICES
    // var vcapString = JSON.stringify()
    // var = env.load()
    done();
  });
});
