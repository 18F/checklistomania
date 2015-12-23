var request = require("request")
describe("API is fully functional", function() {
  it("returns something from api root", function(done) {
      request.get("http://localhost:3000/api/", function(err, response, body) {
            expect(!err && response.statusCode == 200).toBe(true);
            done();
      })
  });

});
