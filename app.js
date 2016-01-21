var express = require('express');
var passport = require('passport');
var util = require('util');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github2').Strategy;
var api = require('./api/api.js');
var request = require('request');
var github = require('./api/github.js').github;


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

if(process.argv[2] === '--test') {
  console.log('skipping authentication...');
  app.use( "/private", [ mockAuthentication, addToUsers, express.static( "private" )]);
  app.use('/api', [ mockAuthentication, addToUsers, api.router]);  
} else {
  app.use( "/private", [ ensureAuthenticated, ensureGithubOrg, addToUsers, express.static( "private" ) ] );
  app.use('/api', [ensureAuthenticated, ensureGithubOrg, addToUsers, api.router]);  
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
  api.db.collection('users').findOne({username: req.user.username},
    function(err, user) {
        if(user) {next()}
        else {
          github.orgs.getFromUser({user: req.user.username}, 
            function(err, orgs) {
                var inOrg = false;
                  orgs.forEach(function(org) {
                    if(org.login == '18F'){
                      inOrg = true;
                    }
                  });
                if(inOrg) {next()}
                else {res.redirect('/not-authorized.html');}
            });
        }; 
});
}

var mockUser;

function mockAuthentication(req, res, next) {
  if(req.query.user) {
    mockUser = req.query.user;    
  } 

  req.user = mockUser;
  next();
}

function addToUsers(req, res, next) {
  api.db.collection('users').findOne({username: req.user.username},
    function(err, user) {
      if(!user) {
        var user = {username: req.user.username, 
          earliestDueDate: new Date().setYear(3000),
          fullName: req.user._json.name,
          imgUrl: req.user._json.avatar_url};
        api.db.collection('users').insert(user)  
      }
      next();    
    });
}

if(process.argv[2] === '--test') {
  var server = require('http').createServer(app);
  server.listen(3000, function () {
    var spawn = require('child_process').spawn;

    console.log('Test server started...');
    
    var shutDownServer = function() {
      console.log("closing server...");
      api.db.dropDatabase();
      api.db.close();
      server.close();
    }

    var spawnProcess = function(args, callback) {
      var newProc = spawn('node', args);
      function logToConsole(data) {
          console.log(String(data));
      }
      newProc.stdout.on('data', logToConsole);
      newProc.stderr.on('data', logToConsole);

      newProc.on('exit', function(exitCode) {
          callback();     
      });  
    }
    // node_modules/.bin/karma start karma.conf.js --no-auto-watch --single-run --reporters=dots --browsers=Firefox
    /*
    spawnProcess(['node_modules/.bin/karma', 'start', 'karma.conf.js', 
      '--no-auto-watch', '--single-run', '--reporters=dots', '--browsers=Firefox'], function() {
      spawnProcess(['node_modules/jasmine-node/bin/jasmine-node', 'spec/apiSpec.js'], shutDownServer)
      */

      spawnProcess(['node_modules/jasmine-node/bin/jasmine-node', 'spec/apiSpec.js'], shutDownServer);
    
  });
} else {
  app.listen(process.env.PORT || 3000)  
}
