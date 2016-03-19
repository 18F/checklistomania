var getApp = require('../app.js').getApp;

var api = require('../api/api.js');
var http = require('http');
http.IncomingMessage.prototype.isAuthenticated = function() {return true};

var passport = {serializeUser : function(callback) {callback({}, function() {})},
				deserializeUser: function(callback) {callback({}, function() {})},
				use: function(strategy) {},
				initialize: function() {return function(req, res, next) {next();}},
				session: function() {return function(req, res, next) {
					if(req.query.user) {
					      mockUser = req.query.user;    
					    } 

					    req.user = mockUser;
					    next();
					};},
				authenticate: function(type, obj) {return function() {}}}

var GitHubStrategy = function(obj, callback) {callback(null, null, null, function() {})};

var github = {orgs : {getFromUser: function(obj, callback) {
		var orgs;
		if(obj.user == 'checkyCheckersmith') {
			orgs = [{login: '18F'}]
		} 
		callback(null, orgs);}},
    user: {getFrom: function(obj, callback) {
        var ghUser;
        if(obj.user) {
          ghUser = {login: 'newUser', name: 'New User', avatar_url: 'http://testNewUser.png'}
        } else {
          ghUser = null;
        }
        callback(null, ghUser);
    }}};

var app = getApp(passport, GitHubStrategy, github);
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

    spawnProcess(['node_modules/jasmine-node/bin/jasmine-node', 'spec/apiSpec.js', '--captureExceptions'], shutDownServer);
  
});