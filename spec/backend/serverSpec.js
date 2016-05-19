/* global describe:false it:false expect:false */
var supertest = require('supertest');

var app = require('../../app.js');

describe('Server is fully functional', function () {
  it('serves from /', function (done) {
    supertest(app)
      .get('/')
      .expect(200)
      .end(done);
  });

  it('redirects from /private when not auth\'d', function (done) {
    supertest(app)
      .get('/private')
      .expect(302)
      .expect('Location', /\/auth/, done)
      .end(done);
  });

  it('redirects from /api when not auth\'d', function (done) {
    supertest(app)
      .get('/api')
      .expect(302)
      .expect('Location', /\/auth/, done)
      .end(done);
  });

  it('redirects after /logout', function (done) {
    supertest(app)
      .get('/logout')
      .expect(302)
      .expect('Location', /\//, done)
      .end(done);
  });
});
