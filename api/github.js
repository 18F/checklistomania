var env = require('../lib/env').load();
var GitHubApi = require('github');

var github = new GitHubApi({
  version: '3.0.0',
  protocol: 'https',
  host: 'api.github.com',
  timeout: 5000,
  headers: {
    'user-agent': 'checklistomania'
  }
});

github.authenticate({
  type: 'oauth',
  key: env.GITHUB_CLIENT_ID,
  secret: env.GITHUB_CLIENT_SECRET
});

module.exports = { github: github };
