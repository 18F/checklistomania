var request = require("request")
describe("API is fully functional", function() {
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

  it("assigns a checklist", function(done) {
      var options = {
        url: "http://localhost:3000/api/assign-checklist",
        qs: {dayZeroDate: new Date().valueOf(), checklistName: 'Simple Test', notes: 'notesHere',
              user: {username: 'testUser', _json: {name: 'Test User', avatar_url: 'http://test.png'}}}
      };

      request.get(options, function(err, response, body) {
            expect(!err && response.statusCode == 200).toBe(true);
            bodyObj = JSON.parse(body);
            expect(bodyObj.checklistName).toBe('Simple Test');
            done();
      })
  });

});
