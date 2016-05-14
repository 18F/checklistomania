
/* eslint-disable no-console */
var http = require('http');
var spawn = require('child_process').spawn;

var api = require('../api/api.js');
var getApp = require('../app.js').getApp;
var passport;
var github;
var mockUser;
var app;
var server;
var GitHubStrategy = function (obj, callback) {
  callback(null, null, null, function () {});
};

http.IncomingMessage.prototype.isAuthenticated = function () { return true; };

passport = {
  serializeUser: function (callback) { callback({}, function () {}); },
  deserializeUser: function (callback) { callback({}, function () {}); },
  use: function () {},
  initialize: function () {
    return function (req, res, next) {
      next();
    };
  },
  session: function () {
    return function (req, res, next) {
      if (req.query.user) {
        mockUser = req.query.user;
      }

      req.user = mockUser;
      next();
    };
  },
  authenticate: function () { return function () {}; }
};


github = {
  orgs: {
    getFromUser: function (obj, callback) {
      var orgs;
      if (obj.user === 'checkyCheckersmith') {
        orgs = [{ login: process.env.GITHUB_ORG }];
      }
      callback(null, orgs);
    }
  },
  user: {
    getFrom: function (obj, callback) {
      var ghUser;
      if (obj.user) {
        ghUser = {
          login: 'newUser',
          name: 'New User',
          avatar_url: 'http://testNewUser.png'
        };
      } else {
        ghUser = null;
      }
      callback(null, ghUser);
    }
  }
};

app = getApp(passport, GitHubStrategy, github);
server = require('http').createServer(app);

server.listen(3000, function () {
  var shutDownServer = function () {
    console.log('closing server...');
    api.db.dropDatabase();
    api.db.close();
    server.close();
  };

  var spawnProcess = function (args, callback) {
    var newProc = spawn('node', args);
    function logToConsole(data) {
      console.log(String(data));
    }
    newProc.stdout.on('data', logToConsole);
    newProc.stderr.on('data', logToConsole);

    newProc.on('exit', function () {
      callback();
    });
  };

  console.log('Test server started...');
  spawnProcess([
    'node_modules/jasmine-node/bin/jasmine-node',
    'spec/apiSpec.js',
    '--captureExceptions'
  ], shutDownServer);
});
