var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var mkdirp = require('mkdirp');
var fs = require('fs');
var github = require('./github.js').github;

var url;
if(process.env.VCAP_SERVICES) {
	vcapServices = JSON.parse(process.env.VCAP_SERVICES);
	url = vcapServices["mongodb26-swarm"][0].credentials.uri	
} else {
	url = 'mongodb://localhost:27017/checklistomania';
}

MongoClient.connect(url, function(err, db) {
	module.exports.db = db;
	items = db.collection("items");
	checklists = db.collection("checklists");
	checklists.remove({})
	users = db.collection("users");

	items.ensureIndex('owner');
	users.ensureIndex('username');

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
});

var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to the api!' });
});

router.get('/isalive', function (req, res) {
  res.send('OK');
});

router.get('/assign-checklist', function (req, res) {
	var dayZeroDate = new Date(parseInt(req.query.dayZeroDate));
	users.findOne({username: req.user.username}, function(err, user) {
		checklists.findOne({checklistName: req.query.checklistName}, function(err, checklist) {
				checklist.items.dayZero["completedDate"] = dayZeroDate;
				timestamp = new Date().getTime();
				for(var itemId in checklist.items){
					var item = checklist.items[itemId];

					item["itemId"] = itemId;
					item["owner"] = req.user.username;
					item["checklistName"] = req.query.checklistName;
					item["notes"] = req.query.notes;
					item["timestamp"] = timestamp;

					if(item.dependsOn.indexOf("dayZero") >= 0) {
						var dueDate = new Date();
						dueDate.setTime(dayZeroDate.getTime() + item.daysToComplete*24*60*60*1000 + 1);
						item["dueDate"] = dueDate;
					};

					items.insert(item);
				}
				setEarliestDueDate(req.user.username, function() {
					res.json({"checklistName": req.query.checklistName, 
						"dayZero": dayZeroDate.toISOString()});
				});
				
			});	
	});
});

router.get('/clear-done', function(req, res) {
	var username = req.query.username || req.user.username;
	items.remove({owner: username, completedDate: {$exists: true}}, function(err, response) {
		res.json({success: true});
	})
})

router.get('/get-items', function(req, res) {
	var username = req.query.username || req.user.username;
	items.find({owner: username})
		.toArray(function(err, userItems) {
			var todos = userItems.filter(function(item) {return (item.dueDate && !item.completedDate)});
			todos.sort(function(item1,item2) {return item1.dueDate.valueOf() - item2.dueDate.valueOf()})
			var notActionable = userItems.filter(function(item) {return (item.dueDate === undefined 
																		&& item.itemId !== 'dayZero')});
			var done = userItems.filter(function(item) {return item.completedDate && item.itemId !== 'dayZero'})

			var allItems = [];

			allItems.push.apply(allItems, todos);
			notActionable.forEach(function(notActionableItem) {
				insertIdx = -1;
				allItems.forEach(function(item, i) {
					var itemIndex = notActionableItem.dependsOn.indexOf(item.itemId);
					if(itemIndex >= 0) {
						notActionableItem.dependsOn.splice(itemIndex, 1);
						if(notActionableItem.dependsOn.length == 0) {
							insertIdx = i
						}
					}
				});
				allItems.splice(insertIdx + 1, 0, notActionableItem);
			});
			allItems.push.apply(allItems, done);
			res.json({items: allItems});		
		});
});

router.get('/get-checklists', function(req, res) {
	checklists.find({}, {sort: [["checklistName", 1]]})
		.toArray(function(err, checklists) {
			if(process.argv[2] !== '--test') {
				noTestChecklist = []
				checklists.forEach(function(checklist) {
					if(checklist.checklistName !== 'Complex Test') {
						noTestChecklist.push(checklist);
					}
				});
				checklists = noTestChecklist;
			}
			res.json({checklists: checklists});		
		});
});

router.get('/get-users', function(req, res) {
	users.find({}).toArray(function(err, users) {
		res.json({users: users});
	});
})

router.get('/complete-item', function(req, res) {
	
	users.findOne({username: req.user.username}, function(err, user) {
		var query = {owner: req.user.username, checklistName: req.query.checklistName, 
			timestamp: parseInt(req.query.timestamp)};

		items.find(query)
			.toArray(function(err, userItems) {
				var updatedItemCount = 0
				userItems.forEach(function(item) {
					if(item._id == req.query.id) {
						item["completedDate"] = new Date();
						items.update({_id: item._id}, item)
						updatedItemCount += 1;
					};

					dependentIndex = item.dependsOn.indexOf(req.query.itemId);
					if(dependentIndex >= 0) {
						item.dependsOn.splice(dependentIndex, 1);
						updatedItemCount += 1;

						if(item.dependsOn.length === 0) {
							var dueDate = new Date();
							dueDate.setDate(new Date().getDate() + item.daysToComplete);
							item["dueDate"] = dueDate;						
						}
						
						items.update({_id: item._id}, item)
					}
				});

				setEarliestDueDate(req.user.username, function() {
					res.json({updatedItemCount: updatedItemCount});	
				});
		});
	});	
});

router.get('/add-user', function(req, res) {
	github.user.getFrom({user: req.query.username}, function(err, ghUser) {
		if(ghUser) {
			var user = {username: ghUser.login, 
			          earliestDueDate: new Date().setYear(3000),
			          fullName: ghUser.name,
			          imgUrl: ghUser.avatar_url};
			users.update({username: user.username}, user, {upsert: true});
			res.json({success: true});
		}
		else {
			res.json({success: false});
		}
	});
});

var setEarliestDueDate = function(username, callback) {
	items.aggregate([{$match: {owner: username, 
		dueDate: {$exists: true},  completedDate: {$exists: false}}}, 
		{$group: {_id: '$owner', earliestDueDate: {$min: '$dueDate'}}}],
		function(err, result) {
			if(result[0]) {
				users.update({username: username}, 
					{$set: {earliestDueDate: result[0].earliestDueDate}})				
			} else {
				users.update({username: username}, 
					{$set: {earliestDueDate: new Date().setYear(3000)}})	
			}
			callback();
		})
}

module.exports.router = router;
