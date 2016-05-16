
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var http = require('http');
var methodOverride = require('method-override');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

var api = require('./api/api.js');
var github = require('./api/github.js').github;

var server;
var app = express();

api.setGithub(github);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/callback'
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.redirect('/auth');
}

function ensureGithubOrg(req, res, next) {
  api.db.collection('users').findOne({ username: req.user.username },
    function (err, user) {
      if (user) {
        next();
      } else {
        github.orgs.getFromUser({ user: req.user.username },
          function (getFromUserErr, orgs) {
            var inOrg = false;
            orgs.forEach(function (org) {
              if (org.login === process.env.GITHUB_ORG) {
                inOrg = true;
              }
            });
            if (inOrg) {
              next();
            } else {
              res.redirect('/not-authorized.html');
            }
          });
      }
    });
}

function addToUsers(req, res, next) {
  api.db.collection('users').findOne({ username: req.user.username },
    function (err, user) {
      var newUser;
      if (!user) {
        newUser = {
          username: req.user.username,
          earliestDueDate: new Date().setYear(3000),
          fullName: req.user._json.name,
          imgUrl: req.user._json.avatar_url
        };
        api.db.collection('users').insert(newUser);
      }
      next();
    });
}

app.use(bodyParser());
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({ secret: process.env.SESSION_SECRET }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/private', [ensureAuthenticated, ensureGithubOrg,
  addToUsers, express.static('private')]);
app.use('/api', [ensureAuthenticated, ensureGithubOrg, addToUsers, api.router]);

app.use('/', express.static('public'));

app.get('/auth', passport.authenticate('github', { scope: ['user:email'] }), function () {});

app.get('/auth/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/private/index.html');
  });

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = app;

if (require.main === module) {
  server = http.createServer(app);
  server.listen(process.env.PORT || 3000, function () {});
}
