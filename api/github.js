var GitHubApi = require("github");


if(process.argv[2] !== '--test') {
var github = new GitHubApi({
      version: "3.0.0",
      protocol: "https",
      host: "api.github.com",
      timeout: 5000,
      headers: {
          "user-agent": "checklistomania" 
      }
  });

github.authenticate({
      type: "oauth",
      key: process.env.GITHUB_CLIENT_ID,
      secret: process.env.GITHUB_CLIENT_SECRET
});
} else {
  var github = {}
  github.user = {getFrom: function(params, callback) {
    if(params.user) {
      var ghUser = {login: params.user, name: params.user + 'Name', avatar_url: 'http://test.png'};
      callback(null, ghUser)      
    } else {
      callback(null, null);
    }
  }}
} 

module.exports = {github: github};