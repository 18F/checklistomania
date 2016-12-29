/* global describe:false it:false expect:false */
var fs = require('fs');
var path = require('path');

var checklistsDir = path.join('checklists');

function forEachChecklist(fn) {
  fs.readdir(checklistsDir, function (err, files) {
    files.forEach(function (file) {
      var chklist = JSON.parse(
        fs.readFileSync(path.join(checklistsDir, file), 'utf8')
      );
      fn(chklist, file);
    });
  });
}


forEachChecklist(function (chklist, file) {
  describe('Valid ' + file, function () {
    it('has a "dayZero" item', function (done) {
      expect(chklist.checklistName).toBeDefined();
      expect(chklist.checklistDescription).toBeDefined();
      expect(chklist.items).toBeDefined();
      expect(chklist.items instanceof Object).toBeTruthy();
      expect(chklist.items.dayZero).toBeDefined();
      expect(chklist.items.dayZero.daysToComplete).toBe(0);
      expect(chklist.items.dayZero.dependsOn instanceof Array).toBeTruthy();
      expect(chklist.items.dayZero.dependsOn.length).toBe(0);
      done();
    });

    it('has dependencies that exist', function (done) {
      var itemNames = Object.keys(chklist.items);
      itemNames.forEach(function (name) {
        var item = chklist.items[name];
        if (item.prompt) {
          item.possibleResponses.forEach(function (response) {
            var responseItemNames = Object.keys(response.items);
            responseItemNames.forEach(function (responseItemName) {
              var responseItem = response.items[responseItemName];
              responseItem.dependsOn.forEach(function (dependency) {
                expect([].concat(itemNames).concat(responseItemNames))
                  .toContain(dependency);
              });
            });
          });
        }
        if (item.dependsOn) {
          expect(item.dependsOn instanceof Array).toBeTruthy();
          item.dependsOn.forEach(function (dependency) {
            expect(itemNames).toContain(dependency);
          });
        }
      });
      done();
    });
  });
});
