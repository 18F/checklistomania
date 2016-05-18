/* eslint-disable no-console */
var spawn = require('child_process').spawn;

var endTesting = function () {
  console.log('ending back end test...');
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

spawnProcess([
  'node_modules/jasmine-node/bin/jasmine-node',
  'spec/serverSpec.js',
  'spec/apiSpec.js',
  '--captureExceptions'
], endTesting);
