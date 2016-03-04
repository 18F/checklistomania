var request = require("request");
var async = require("async");
var fs = require('fs');

describe("API is fully functional", function() {

  var user = {username: 'checkyCheckersmith', _json: {name: 'Test User', avatar_url: 'http://test.png'}};
  
  var compileChecklist = function(checklist) {
    compiledItems = {};
    Object.keys(checklist.items).forEach(function(itemId) {
      if(!checklist.items[itemId].prompt) {
        compiledItems[itemId] = checklist.items[itemId];
      }
    })

    checklist.items = compiledItems;
    return checklist;
  }

  var assignChecklist = function(callback) {
      var checklist = JSON.parse(fs.readFileSync('checklists/example.json', 'utf8'));
      checklist = compileChecklist(checklist);
      var options = {
        url: "http://localhost:3000/api/assign-checklist",
        json: {dayZeroDate: new Date().valueOf(), checklist: checklist, notes: 'notesHere',
              user: user}
      };

      request.post(options, function(err, response, body) {
        callback();
      });
  };

  it("returns something from api root", function(done) {
      var options = {
        url: "http://localhost:3000/api/",
        qs: {user: user}};
      request.get(options, function(err, response, body) {
            expect(!err && response.statusCode == 200).toBe(true);
            done();
      })
  });

  it("returns isalive", function(done) {
      var options = {
        url: "http://localhost:3000/api/isalive",
        qs: {user: user}};
      request.get(options, function(err, response, body) {
            expect(!err && response.statusCode == 200 && body == 'OK').toBe(true);
            done();
      })
  });

  it("gets items", function(done) {
      assignChecklist(function() {
          var options = {
            url: "http://localhost:3000/api/get-items",
            qs: {user: user}
          }

          request.get(options, function(err, response, body) {
                expect(!err && response.statusCode == 200).toBe(true);
                bodyObj = JSON.parse(body);
                expect(bodyObj.items.length > 0).toBe(true);
                done();
          })
      });
  });

  it("assigns to a checklist", function(done) {
      var checklist = JSON.parse(fs.readFileSync('checklists/example.json', 'utf8'));
      checklist = compileChecklist(checklist);
      var options = {
        url: "http://localhost:3000/api/assign-checklist",
        json: {dayZeroDate: new Date().valueOf(), checklist: checklist, notes: 'notesHere',
              user: user}
      };

      request.post(options, function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          expect(body.checklistName).toBe('Example Checklist');
          done();
      }); 
  });

  it("gets checklists", function(done) {
      var options = {
        url: "http://localhost:3000/api/get-checklists",
        qs: {user: user}
      };

      request.get(options, function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          bodyObj = JSON.parse(body);
          expect(bodyObj.checklists.length > 0).toBe(true);
          done();
      }); 
  });

  it("doesn't add a null a user", function(done) {
      var options = {
        url: "http://localhost:3000/api/add-user",
        qs: {username: null}
      };

      request.get(options, function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          bodyObj = JSON.parse(body);
          expect(bodyObj.success).toBe(false);
          done();
      }); 
  });

  it("gets users", function(done) {
      var options = {
        url: "http://localhost:3000/api/get-users",
        qs: {user: user}
      };

      request.get(options, function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          bodyObj = JSON.parse(body);
          expect(bodyObj.users.filter(function(user) {
            return user.username === 'checkyCheckersmith'}).length == 1).toBe(true);
          done();
      }); 
  });

  it("adds a user", function(done) {
      var options = {
        url: "http://localhost:3000/api/add-user",
        qs: {username: 'anthonygarvan'}
      };

      request.get(options, function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          bodyObj = JSON.parse(body);
          expect(bodyObj.success).toBe(true);
          done();
      }); 
  });
  
  it("Marks items as complete and clears them", function(done) {
      assignChecklist(function() {
          var items;    
          var markItemComplete = function(item, callback) {
                  var options = {
                    url: "http://localhost:3000/api/complete-item",
                    qs: {user: user, timestamp: item.timestamp, 
                      id: item._id, checklistName: item.checklistName,
                      itemId: item.itemId}
                  };

                  request.get(options, function(err, response, body) {
                    expect(!err && response.statusCode == 200).toBe(true);
                    bodyObj = JSON.parse(body);
                    expect(bodyObj.updatedItemCount > 0).toBe(true);
                    callback();
                  });  
          };
          
          var markUndoneItemsComplete = function(callback) {
            var options = {
              url: "http://localhost:3000/api/get-items",
              qs: {user: user}
            }
            request.get(options, function(err, response, body) {
                  items = JSON.parse(body).items;
                  async.eachSeries(items, markItemComplete, callback);                    
          });
          };
          
          function clearItems(callback) {
            var options = {
                url: "http://localhost:3000/api/clear-done",
                qs: {user: user}
              }
              request.get(options, function(err, response, body) {
                expect(!err && response.statusCode == 200).toBe(true);
                bodyObj = JSON.parse(body);
                expect(bodyObj.success).toBe(true);

                var options = {
                  url: "http://localhost:3000/api/get-items",
                  qs: {user: user}
                }

                request.get(options, function(err, response, body) {
                      expect(!err && response.statusCode == 200).toBe(true);
                      bodyObj = JSON.parse(body);
                      expect(bodyObj.items.length == 0).toBe(true);
                      done();
            })
            });  
          }

          async.whilst(function() {return !items || !items[0].completedDate}, markUndoneItemsComplete, 
            function() {clearItems(done);});

      });
  });

});
