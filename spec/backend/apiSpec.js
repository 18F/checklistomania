/* global describe:false it:false expect:false */
var async = require('async');
var fs = require('fs');
var express = require('express');
var supertest = require('supertest');
var mockery = require('mockery');

var app = express();
var api;

var checkyUser = {
  username: 'checkyCheckersmith',
  _json: {
    name: 'Test User',
    avatar_url: 'http://test.png'
  }
};

function getExampleChecklist() {
  var checklist = JSON.parse(fs.readFileSync('checklists/example.json', 'utf8'));

  var compiledItems = {};
  Object.keys(checklist.items).forEach(function (itemId) {
    if (!checklist.items[itemId].prompt) {
      compiledItems[itemId] = checklist.items[itemId];
    }
  });

  checklist.items = compiledItems;
  return checklist;
}

mockery.registerMock('./github.js', {
  github: {
    user: {
      getFrom: function (obj, callback) {
        var ghUser;
        if (obj.user === 'newUser') {
          ghUser = {
            login: 'newUser',
            name: 'New User',
            avatar_url: 'http://testNewUser.png'
          };
        } else {
          ghUser = null;
        }
        callback(null, ghUser);
      }
    }
  }
});

mockery.enable({
  warnOnUnregistered: false
});

// add middleware to add mock authenticated user to requests
app.use(function (req, res, next) {
  req.user = checkyUser;
  next();
});

api = require('../../api/api.js');
app.use('/api', api.router);

describe('API is fully functional', function () {
  it('returns something from api root', function (done) {
    supertest(app)
      .get('/api')
      .expect(200)
      .end(done);
  });

  it('returns isalive', function (done) {
    supertest(app)
      .get('/api/isalive')
      .expect(200)
      .expect('OK')
      .end(done);
  });

  it('assigns to a checklist', function (done) {
    var checklist = getExampleChecklist();
    supertest(app)
      .post('/api/assign-checklist')
      .send({
        dayZeroDate: new Date().valueOf(),
        checklist: checklist,
        notes: 'notesHere',
        user: checkyUser
      })
      .expect(200)
      .expect(function (res) {
        expect(res.body.checklistName === 'Example Checklist').toBe(true);
      })
      .end(done);
  });

  it('gets items', function (done) {
    var checklist = getExampleChecklist();

    supertest(app)
      .post('/api/assign-checklist')
      .send({
        dayZeroDate: new Date().valueOf(),
        checklist: checklist,
        notes: 'notesHere',
        user: checkyUser
      })
      .expect(200)
      .end(function () {
        supertest(app)
          .get('/api/get-items')
          .expect(200)
          .expect(function (res) {
            expect(res.body.items.length > 0).toBe(true);
          })
          .end(done);
      });
  });

  it('gets checklists', function (done) {
    supertest(app)
      .get('/api/get-checklists')
      .expect(200)
      .expect(function (res) {
        expect(res.body.checklists.length > 0).toBe(true);
      })
      .end(done);
  });

  it('doesn\'t add a null a user', function (done) {
    supertest(app)
      .get('/api/add-user')
      .query({ username: null })
      .expect(200, {
        success: false
      })
      .end(done);
  });

  it('adds a user', function (done) {
    supertest(app)
      .get('/api/add-user')
      .query({ username: 'newUser' })
      .expect(200, {
        success: true
      })
      .end(done);
  });

  it('gets users', function (done) {
    supertest(app)
      .get('/api/get-users')
      .expect(200)
      .expect(function (res) {
        expect(res.body.users.filter(function (u) {
          return u.username === 'newUser';
        }).length === 1).toBe(true);
      })
      .end(done);
  });

  it('Marks items as complete and clears them', function (done) {
    var checklist = getExampleChecklist();
    supertest(app)
      .post('/api/assign-checklist')
      .send({
        dayZeroDate: new Date().valueOf(),
        checklist: checklist,
        notes: 'notesHere',
        user: checkyUser
      })
      .expect(200)
      .end(function () {
        var items;
        var markItemComplete = function (item, callback) {
          supertest(app)
            .get('/api/complete-item')
            .query({
              user: checkyUser,
              timestamp: item.timestamp,
              id: item._id,
              checklistName: item.checklistName,
              itemId: item.itemId
            })
            .expect(200)
            .expect(function (res) {
              expect(res.body.updatedItemCount > 0).toBe(true);
            })
            .end(callback);
        };

        var markUndoneItemsComplete = function (callback) {
          supertest(app)
            .get('/api/get-items')
            .expect(function (res) {
              items = res.body.items;
            })
            .end(function () {
              async.eachSeries(items, markItemComplete, callback);
            });
        };

        function clearItems() {
          supertest(app)
            .get('/api/clear-done')
            .expect(200, {
              success: true
            })
            .end(function () {
              supertest(app)
                .get('/api/get-items')
                .expect(200)
                .expect(function (res) {
                  expect(res.body.items.length === 0).toBe(true);
                })
                .end(done);
            });
        }

        async.whilst(
          function () {
            return !items || !items[0].completedDate;
          },
          markUndoneItemsComplete,
          function () {
            clearItems(done);
          });
      });
  });

  it('Closes the db connection', function (done) {
    // "test" that closes the db connection
    // so that the test runner does not hang
    api.db.dropDatabase();
    api.db.close();
    done();
  });
});
