var request = require("request");
var async = require("async");

describe("API is fully functional", function() {

  var user = {username: 'checkyCheckersmith', _json: {name: 'Test User', avatar_url: 'http://test.png'}};
  
  var assignChecklist = function(callback) {
    var options = {
        url: "http://localhost:3000/api/assign-checklist",
        qs: {dayZeroDate: new Date().valueOf(), checklistName: 'Complex Test', notes: 'notesHere',
              user: user}
      };

      request.get(options, function(err, response, body) {
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
      var options = {
        url: "http://localhost:3000/api/assign-checklist",
        qs: {dayZeroDate: new Date().valueOf(), checklistName: 'Complex Test', notes: 'notesHere',
              user: user}
      };

      request.get(options, function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          bodyObj = JSON.parse(body);
          expect(bodyObj.checklistName).toBe('Complex Test');
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
          expect(bodyObj.users[0].username === 'checkyCheckersmith').toBe(true);
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
  
  it("Marks items as complete", function(done) {
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
          
          async.whilst(function() {return !items || items.length > 0}, markUndoneItemsComplete, done);
      });
  });

});
