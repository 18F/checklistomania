
var ejs = require('ejs');
var express = require('express');
var session = require('express-session');
var http = require('http');
var methodOverride = require('method-override');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

var api = require('./api/api.js');
var middleware = require('./lib/middleware.js');
var ensureAuthenticated = middleware.ensureAuthenticated;
var ensureGithubOrg = middleware.ensureGithubOrg;
var addToUsers = middleware.addToUsers;
var includeBranding = middleware.includeBranding;

var server;
var app = express();
var port = process.env.PORT || 3000;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:' + port + '/auth/callback'
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}));

app.engine('html', ejs.renderFile);
app.set('views', process.cwd() + '/views');

app.use(methodOverride());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/private/index.html', [ensureAuthenticated, ensureGithubOrg,
  addToUsers, includeBranding],
  function (req, res) {
    res.render('index.html');
  }
);

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
  server.listen(port, function () {
    console.log('Checklistomania started on port ' + port); // eslint-disable-line no-console
  });
}
