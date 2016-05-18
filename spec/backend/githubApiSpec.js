/* global describe:false it:false expect:false */
var GitHubApi = require('github');

var github = require('../../api/github.js').github;

describe('github api', function () {
  it('is an instance of GitHubApi', function () {
    expect(github instanceof GitHubApi).toBe(true);
  });
});
