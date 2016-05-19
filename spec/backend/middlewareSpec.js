/* global describe:false it:false expect:false */
var sinon = require('sinon');
var mockery = require('mockery');

var middleware;
var userInsert;

mockery.registerMock('../api/github.js', {
  github: {
    orgs: {
      getFromUser: function (params, callback) {
        if (params.user === 'userInOrg') {
          callback(null, [{ login: process.env.GITHUB_ORG }]);
        } else {
          callback(new Error('user not found'), []);
        }
      }
    }
  }
});


mockery.registerMock('../api/api.js', {
  db: {
    collection: function () {
      return {
        findOne: function (options, callback) {
          if (options.username === 'validUser') {
            callback(null, { user: 'validUser' });
          } else {
            callback(new Error('User not found'));
          }
        },
        insert: userInsert
      };
    }
  }
});

mockery.enable({
  warnOnUnregistered: false
});

middleware = require('../../lib/middleware.js');

describe('custom middleware functions', function () {
  describe('ensureAuthenticated', function () {
    it('calls next when user is authenticated', function () {
      var req = {
        isAuthenticated: function () { return true; }
      };
      var res = {};
      var next = sinon.spy();

      middleware.ensureAuthenticated(req, res, next);
      expect(next.called).toBe(true);
    });

    it('redirects when user is not authenticated', function () {
      var req = {
        isAuthenticated: function () { return false; }
      };
      var res = {
        redirect: sinon.spy()
      };

      middleware.ensureAuthenticated(req, res);
      expect(res.redirect.called).toBe(true);
    });
  });

  describe('ensureGithubOrg', function () {
    it('calls next when an already valid user is in request', function () {
      var req = {
        user: {
          username: 'validUser'
        }
      };
      var res = {};
      var next = sinon.spy();

      middleware.ensureGithubOrg(req, res, next);
      expect(next.called).toBe(true);
    });

    it('calls next when a user in GITHUB_ORG is in request', function () {
      var req = {
        user: {
          username: 'userInOrg'
        }
      };
      var res = {};
      var next = sinon.spy();

      middleware.ensureGithubOrg(req, res, next);
      expect(next.called).toBe(true);
    });

    it('redirects when a user not in GITHUB_ORG is in request', function () {
      var req = {
        user: {
          username: 'invalidUser'
        }
      };
      var res = {
        redirect: sinon.spy()
      };

      middleware.ensureGithubOrg(req, res);
      expect(res.redirect.called).toBe(true);
    });
  });

  describe('addToUsers', function () {
    it('calls next when a user is already in the db', function () {
      var req = {
        user: {
          username: 'validUser'
        }
      };
      var res = {};
      var next = sinon.spy();

      middleware.addToUsers(req, res, next);
      expect(next.called).toBe(true);
    });

    it('adds new user to db and calls next', function () {
      var req = {
        user: {
          username: 'newUser',
          _json: {
            fullName: 'New User',
            imgUrl: 'http://newuser.png'
          }
        }
      };
      var res = {};
      var next = sinon.spy();

      userInsert = sinon.spy();
      middleware.addToUsers(req, res, next);
      expect(userInsert.called).toBe(true);
      expect(userInsert.firstCall.args[0].username).toBe('newUser');
      expect(next.called).toBe(true);
    });

    it('doesn\t add existing user to the db and calls next', function () {
      var req = {
        user: {
          username: 'validUser'
        }
      };
      var res = {};
      var next = sinon.spy();

      userInsert = sinon.spy();

      middleware.addToUsers(req, res, next);
      expect(userInsert.called).toBe(false);
      expect(next.called).toBe(true);
    });
  });

  describe('includeBranding', function () {
    it('sets logoPath and headerColor in res.locals, then calls next', function () {
      var req = {};
      var res = {
        locals: {}
      };
      var next = sinon.spy();

      middleware.includeBranding(req, res, next);
      expect(res.locals.logoPath).toBeDefined();
      expect(res.locals.headerColor).toBeDefined();
      expect(next.called).toBe(true);
    });

    it('sets logoPath and headerColor from env variables', function () {
      var req = {};
      var res = {
        locals: {}
      };
      var next = sinon.spy();
      process.env.BRAND_LOGO_PATH = '/testpath.jpg';
      process.env.BRAND_HEADER_COLOR = 'red';

      middleware.includeBranding(req, res, next);
      expect(res.locals.logoPath).toEqual('/testpath.jpg');
      expect(res.locals.headerColor).toEqual('red');
      expect(next.called).toBe(true);
    });
  });
});
