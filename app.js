var express = require('express');
var passport = require('passport');
var util = require('util');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github2').Strategy;
var api = require('./api/api.js');
var request = require('request');
  
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/auth/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
        return done(null, profile);
    });
  }
));

var app = express();


app.use(bodyParser());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

if(process.env.SKIP_AUTH && process.env.SKIP_AUTH === 'true') {
  console.log('skipping authentication...');
  app.use( "/private", express.static( "private" ));
  app.use('/api', api.router);  
} else {
  app.use( "/private", [ ensureAuthenticated, ensureGithubOrg, express.static( "private" ) ] );
  app.use('/api', [ensureAuthenticated, ensureGithubOrg, api.router]);  
}

app.use( "/", express.static( "public" ) );

app.get('/', function(req, res){
  res.send("Welcome!");
});

app.get('/auth',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res){
  });

app.get('/auth/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth');
};

function ensureGithubOrg(req, res, next) {
  var options = {
    url: req.user._json.organizations_url,
    headers: {
      'User-Agent': 'checklistomania'
    }
  };

  request(options, function (error, response, body) {
    inOrg = false;
    if (!error && response.statusCode == 200) {
      var orgs = JSON.parse(body);
      orgs.forEach(function(org) {
        if(org.login == '18F'){
          inOrg = true;
        }
      });
    } else {console.log(response);};
    if(inOrg) {next()}
    else {res.redirect('/not-authorized.html');}
  })
}

app.listen(process.env.PORT || 3000)