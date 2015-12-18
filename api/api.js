var express = require('express');

var Engine = require('tingodb')()
var mkdirp = require('mkdirp');
var fs = require('fs');

var dbPath = __dirname + '/db';
mkdirp(dbPath, function(err) {
  db = new Engine.Db(dbPath, {});
  items = db.collection("items");
  checklists = db.collection("checklists");
  fs.readdir('./checklists', function(err, files) {
  	files.forEach(function(fileName) {
	  var filePath = 'checklists/' + fileName;
	  fs.readFile(filePath, 'utf8',
	  	function(err, data) {
	  		checklist = JSON.parse(data);
	  		checklists.update({"checklistName": checklist.checklistName}, checklist, {"upsert": true});
	  	})		
  	});
  });
})

var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to the api!' });
});

router.get('/isalive', function (req, res) {
  res.send('OK');
});

router.get('/assign-checklist', function (req, res) {
	var dayZeroDate = new Date(parseInt(req.query.dayZeroDate));
	checklists.findOne({checklistName: req.query.checklistName}, function(err, checklist) {
		checklist.items.dayZero["completedDate"] = dayZeroDate;
		for(var itemId in checklist.items){
			var item = checklist.items[itemId];

			item["itemId"] = itemId;
			item["owner"] = req.user.username;
			item["checklistName"] = req.query.checklistName;

			if(item.dependsOn.indexOf("dayZero") >= 0) {
				var dueDate = new Date();
				dueDate.setDate(dayZeroDate.getDate() + item.daysToComplete);
				item["dueDate"] = dueDate;
			};
			items.update({itemId: itemId, checklistName: req.query.checklistName, owner: req.user.username},
				item, {upsert: true});
		}
		res.json({"checklistName": req.query.checklistName, "dayZero": dayZeroDate.toISOString()});
	});
});

router.get('/get-items', function(req, res) {
	var username = req.query.username || req.user.username;
	items.find({owner: username, dueDate: {$exists: true}, completedDate: {$exists: false}}, {sort: [["dueDate", 1]]})
		.toArray(function(err, userItems) {
			res.json({items: userItems});		
		});
});

router.get('/get-checklists', function(req, res) {
	checklists.find({}, {sort: [["checklistName", 1]]})
		.toArray(function(err, checklists) {
			res.json({checklists: checklists});		
		});
});

router.get('/get-users', function(req, res) {
	items.find({}).toArray(function(err, allItems) {
		users = {};
		allItems.forEach(function(item) {
			if(!(item.owner in users)) {
				users[item.owner] = {earliestDueDate: new Date().setYear(3000)};
			}

			if(!item.completedDate && item.dueDate < users[item.owner].earliestDueDate) {
				users[item.owner].earliestDueDate = item.dueDate;
			}
		})
		res.json({users: users});
	})
})

router.get('/complete-item', function(req, res) {
	items.find({owner: req.user.username, checklistName: req.query.checklistName})
		.toArray(function(err, userItems) {
			userItems.forEach(function(item) {
				if(item.itemId === req.query.itemId) {
					item["completedDate"] = new Date();
					items.update({_id: item._id}, item)
				};

				if(item.dependsOn.indexOf(req.query.itemId) >= 0) {
					var dueDate = new Date();
					dueDate.setDate(new Date().getDate() + item.daysToComplete);
					item["dueDate"] = dueDate;
					items.update({_id: item._id}, item)
				}	
			});
			res.json({success: true});
	});
		
});

module.exports = {router: router};