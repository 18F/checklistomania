/* global describe:false it:false expect:false */
var fs = require('fs');
var path = require('path');

var checklistsDir = path.join('checklists');

describe('checklists are valid', function () {
  it('all have a "dayZero" item', function (done) {
    fs.readdir(checklistsDir, function (err, files) {
      files.forEach(function (file) {
        var chklist = JSON.parse(
          fs.readFileSync(path.join(checklistsDir, file), 'utf8')
        );
        expect(chklist.checklistName).toBeDefined();
        expect(chklist.checklistDescription).toBeDefined();
        expect(chklist.items).toBeDefined();
        expect(chklist.items instanceof Object).toBeTruthy();
        expect(chklist.items.dayZero).toBeDefined();
        expect(chklist.items.dayZero.daysToComplete).toBe(0);
        expect(chklist.items.dayZero.dependsOn instanceof Array).toBeTruthy();
        expect(chklist.items.dayZero.dependsOn.length).toBe(0);
      });
      done();
    });
  });
});
