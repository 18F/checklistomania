var express = require('express');

var Engine = require('tingodb')()
var mkdirp = require('mkdirp');
var fs = require('fs');

var dbPath = __dirname + '/db';
mkdirp(dbPath, function(err) {
  db = new Engine.Db(dbPath, {});
  checklists = db.collection("checklists");
  fs.readFile('checklists/test.json', 'utf8',
  	function(err, data) {
  		checklist = JSON.parse(data);
  		checklists.update({"checklistName": checklist.name}, checklist, {"upsert": true});
  	})
  items = db.collection("items");
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
	console.log(req.query.checkListName);
	checklists.findOne({checkListName: req.query.checkListName}, function(err, checklist) {
		checklist.items.dayZero["completedDate"] = dayZeroDate;
		for(var itemId in checklist.items){
			var item = checklist.items[itemId];

			item["itemId"] = itemId;
			item["owner"] = req.user.username;
			item["checkListName"] = req.query.checkListName;

			if(item.dependsOn.indexOf("dayZero") >= 0) {
				dueDate = new Date();
				dueDate.setDate(dayZeroDate.getDate() + item.daysToComplete);
				item["dueDate"] = dueDate;
			};
			console.log(item);	
			items.update({itemId: itemId, checkListName: req.query.checkListName, owner: req.user.username},
				item, {upsert: true});
		}
		res.json({"checkListName": req.query.checkListName, "dayZero": dayZeroDate.toISOString()});
	});
});

router.get('/get-items', function(req, res) {
	var username = req.query.username || req.user.username;
	items.find({owner: username}, {sort: [["dueDate", 1]]})
		.toArray(function(err, userItems) {
			res.json({items: userItems});		
		});
})

module.exports = {router: router};