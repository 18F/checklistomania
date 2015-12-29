var request = require("request");

describe("API is fully functional", function() {

  var user = {username: 'testUser', _json: {name: 'Test User', avatar_url: 'http://test.png'}};
  
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
      request.get("http://localhost:3000/api/", function(err, response, body) {
            expect(!err && response.statusCode == 200).toBe(true);
            done();
      })
  });

  it("returns isalive", function(done) {
      request.get("http://localhost:3000/api/isalive", function(err, response, body) {
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
      };

      request.get("http://localhost:3000/api/get-checklists", function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          bodyObj = JSON.parse(body);
          expect(bodyObj.checklists.length > 0).toBe(true);
          done();
      }); 
  });

  it("gets users", function(done) {
      var options = {
        url: "http://localhost:3000/api/get-users",
      };

      request.get(options, function(err, response, body) {
          expect(!err && response.statusCode == 200).toBe(true);
          bodyObj = JSON.parse(body);
          expect(user.username in bodyObj.users).toBe(true);
          done();
      }); 
  });

  it("Marks items as complete", function(done) {
      assignChecklist(function() {
            var options = {
            url: "http://localhost:3000/api/get-items",
            qs: {user: user}
          }

          request.get(options, function(err, response, body) {
                item = JSON.parse(body).items[0];
                var options = {
                  url: "http://localhost:3000/api/complete-item",
                  qs: {user: user, timestamp: item.timestamp, 
                    id: item._id, checklistName: item.checklistName,
                    itemId: item.itemId}
                }

                request.get(options, function(err, response, body) {
                  expect(!err && response.statusCode == 200).toBe(true);
                  bodyObj = JSON.parse(body);
                  expect(bodyObj.updatedItemCount > 0).toBe(true);
                  done();
                });
          })
      });
  });

});
