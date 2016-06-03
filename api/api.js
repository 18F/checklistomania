var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

var github = require('./github.js').github;

var url;
var router = express.Router(); // eslint-disable-line new-cap
var vcapServices;
var items;
var checklists;
var users;

var setEarliestDueDate = function (username, callback) {
  items.aggregate([
    {
      $match: {
        owner: username,
        dueDate: { $exists: true },
        completedDate: { $exists: false }
      }
    },
    {
      $group: {
        _id: '$owner',
        earliestDueDate: { $min: '$dueDate' }
      }
    }],
    function (err, result) {
      if (result[0]) {
        users.update({ username: username },
          { $set: { earliestDueDate: result[0].earliestDueDate }
        });
      } else {
        users.update({ username: username },
          { $set: { earliestDueDate: new Date().setYear(3000) }
        });
      }
      callback();
    });
};

if (process.env.VCAP_SERVICES) {
  vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  url = vcapServices['mongodb26-swarm'][0].credentials.uri;
} else {
  url = 'mongodb://localhost:27017/checklistomania';
}

MongoClient.connect(url, function (connectErr, db) {
  items = db.collection('items');
  checklists = db.collection('checklists');
  users = db.collection('users');

  checklists.remove({});
  items.ensureIndex('owner');
  users.ensureIndex('username');

  module.exports.db = db;

  fs.readdir('./checklists', function (readdirErr, files) {
    files.forEach(function (fileName) {
      var filePath = 'checklists/' + fileName;
      fs.readFile(filePath, 'utf8', function (readFileErr, data) {
        var checklist = JSON.parse(data);
        checklists.insert(checklist);
      });
    });
  });
});

router.use(bodyParser.json());

router.get('/', function (req, res) {
  res.json({ message: 'hooray! welcome to the api!' });
});

router.get('/isalive', function (req, res) {
  res.send('OK');
});

function addChildrenToChecklist(checklist) {
  Object.keys(checklist.items).forEach(function (itemId) {
    checklist.items[itemId].children = [];
  });
  Object.keys(checklist.items).forEach(function (itemId) {
    checklist.items[itemId].dependsOn.forEach(function (dependencyItemId) {
      if (checklist.items[dependencyItemId].children) {
        checklist.items[dependencyItemId].children.push(itemId);
      }
    });
  });

  return checklist;
}

function getSortedItemIds(checklist) {
  // JSON.parse(JSON.stringify(obj)) produces a copy of the input obj
  var checklistCopy = JSON.parse(JSON.stringify(checklist));

  var actionable;

  // define breadth first search
  function visit(itemId) {
    var sorted = [itemId];
    // visit children
    checklistCopy.items[itemId].children.forEach(function (childItemId) {
      checklistCopy.items[childItemId].dependsOn.splice(
        checklistCopy.items[childItemId].dependsOn.indexOf(childItemId), 1);
    });

    // get actionable
    actionable = checklistCopy.items[itemId].children.filter(function (id) {
      return checklistCopy.items[id].dependsOn.length === 0;
    });

    // sort actionable
    actionable.sort(function (itemId1, itemId2) {
      return (checklistCopy.items[itemId1].daysToComplete
        - checklistCopy.items[itemId2].daysToComplete);
    });

    // traverse actionable
    actionable.forEach(function (id) {
      visit(id).forEach(function (traversedChild) {
        sorted.push(traversedChild);
      });
    });

    return sorted;
  }

  return visit('dayZero');
}

router.post('/assign-checklist', function (req, res) {
  var sorted;
  var timestamp = new Date().getTime();
  var dayZeroDate = new Date(parseInt(req.body.dayZeroDate, 10));
  var checklist = req.body.checklist;

  checklist.items.dayZero.completedDate = dayZeroDate;
  checklist.items.dayZero.estimatedDueDate = dayZeroDate;
  checklist = addChildrenToChecklist(checklist);
  sorted = getSortedItemIds(checklist);

  sorted.forEach(function (itemId) {
    var dueDate;
    var item = checklist.items[itemId];

    item.itemId = itemId;
    item.owner = req.user.username;
    item.checklistName = checklist.checklistName;
    item.notes = req.body.notes;
    item.timestamp = timestamp;

    item.children.forEach(function (childItemId) {
      var estimatedDueDate = new Date();
      var childItem = checklist.items[childItemId];
      estimatedDueDate.setTime(item.estimatedDueDate.getTime()
        + childItem.daysToComplete * 24 * 60 * 60 * 1000 + 1
      );
      checklist.items[childItemId].estimatedDueDate = estimatedDueDate;
    });

    if (item.dependsOn.indexOf('dayZero') >= 0) {
      dueDate = new Date();
      dueDate.setTime(dayZeroDate.getTime() + item.daysToComplete * 24 * 60 * 60 * 1000 + 1);
      item.dueDate = dueDate;
    }
    items.insert(item);
  });

  setEarliestDueDate(req.user.username, function () {
    res.json({
      checklistName: checklist.checklistName,
      dayZero: dayZeroDate.toISOString()
    });
  });
});

router.get('/clear-done', function (req, res) {
  var username = req.query.username || req.user.username;
  items.remove({ owner: username, completedDate: { $exists: true } },
    function () {
      res.json({ success: true });
    });
});

router.get('/get-items', function (req, res) {
  var username = req.query.username || req.user.username;

  function alphaSort(item1, item2) {
    if (item1.displayName < item2.displayName) return -1;
    if (item1.displayName > item2.displayName) return 1;
    return 0;
  }

  items.find({ owner: username })
    .toArray(function (err, userItems) {
      var undone = userItems
      .filter(function (item) {
        return !item.completedDate && item.itemId !== 'dayZero';
      })
      .sort(function (item1, item2) {
        return (item1.estimatedDueDate - item2.estimatedDueDate) || alphaSort(item1, item2);
      });

      var done = userItems
        .filter(function (item) {
          return item.completedDate && item.itemId !== 'dayZero';
        })
        .sort(function (item1, item2) {
          return item1.estimatedDueDate - item2.estimatedDueDate;
        });

      var allItems = [];
      undone.forEach(function (item) { allItems.push(item); });
      done.forEach(function (item) { allItems.push(item); });

      res.json({ items: allItems });
    });
});

router.get('/get-checklists', function (req, res) {
  checklists.find({}, { sort: [['checklistName', 1]] })
    .toArray(function (err, results) {
      res.json({ checklists: results });
    });
});

router.get('/get-users', function (req, res) {
  users.find({}).toArray(function (err, results) {
    res.json({ users: results });
  });
});

router.get('/complete-item', function (req, res) {
  users.findOne({ username: req.user.username }, function () {
    var query = {
      owner: req.user.username,
      checklistName: req.query.checklistName,
      timestamp: parseInt(req.query.timestamp, 10)
    };

    items.find(query)
      .toArray(function (err, userItems) {
        var updatedItemCount = 0;

        userItems.forEach(function (item) {
          var dependentIndex;
          var dueDate;
          if (item._id.toString() === req.query.id) {
            item.completedDate = new Date();
            items.update({ _id: item._id }, item);
            updatedItemCount += 1;
          }

          dependentIndex = item.dependsOn.indexOf(req.query.itemId);
          if (dependentIndex >= 0) {
            item.dependsOn.splice(dependentIndex, 1);
            updatedItemCount += 1;

            if (item.dependsOn.length === 0) {
              dueDate = new Date();
              dueDate.setDate(new Date().getDate() + item.daysToComplete);
              item.dueDate = dueDate;
            }

            items.update({ _id: item._id }, item);
          }
        });

        setEarliestDueDate(req.user.username, function () {
          res.json({ updatedItemCount: updatedItemCount });
        });
      });
  });
});

router.get('/add-user', function (req, res) {
  github.user.getFrom({ user: req.query.username }, function (err, ghUser) {
    var user;
    if (ghUser) {
      user = {
        username: ghUser.login,
        earliestDueDate: new Date().setYear(3000),
        fullName: ghUser.name,
        imgUrl: ghUser.avatar_url
      };
      users.update({ username: user.username }, user, { upsert: true });
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  });
});

module.exports.router = router;
