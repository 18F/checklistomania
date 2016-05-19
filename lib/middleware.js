

var api = require('../api/api.js');
var github = require('../api/github.js').github;

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

function includeBranding(req, res, next) {
  res.locals.logoPath = process.env.BRAND_LOGO_PATH || '/private/img/18F-Logo-M.png';
  res.locals.headerColor = process.env.BRAND_HEADER_COLOR || '#B3EFFF';
  next();
}

module.exports = {
  ensureAuthenticated: ensureAuthenticated,
  ensureGithubOrg: ensureGithubOrg,
  addToUsers: addToUsers,
  includeBranding: includeBranding
};
