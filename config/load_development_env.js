function loadDevelopmentEnv() {
  var env   = require("./env");
  process.env.SESSION_SECRET = env.SESSION_SECRET;
  process.env.GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
  process.env.GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;
  process.env.GITHUB_CALLBACK_URL = env.GITHUB_CALLBACK_URL;
  process.env.GITHUB_AUTH_ORG = env.GITHUB_AUTH_ORG;
}

module.exports = loadDevelopmentEnv;
