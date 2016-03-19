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
	  		checklists.insert(checklist);
	  	});		
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

function addChildrenToChecklist(checklist) {
	Object.keys(checklist.items).forEach(function(itemId) {checklist.items[itemId].children = []});
	Object.keys(checklist.items).forEach(function(itemId) {
		checklist.items[itemId].dependsOn.forEach(function(dependencyItemId) {
			if(checklist.items[dependencyItemId].children) {
				checklist.items[dependencyItemId].children.push(itemId);
			};
		});
	});

	return checklist;
}

function getSortedItemIds(checklist) {
	checklist = JSON.parse(JSON.stringify(checklist));

	// define breadth first search
	function visit(itemId) {
		var sorted = [itemId];
		// visit children
		checklist.items[itemId].children.forEach(function(childItemId) {
			checklist.items[childItemId].dependsOn.splice(
				checklist.items[childItemId].dependsOn.indexOf(childItemId), 1);
		});

		// get actionable
		var actionable = checklist.items[itemId].children.filter(function(itemId) {
			return checklist.items[itemId].dependsOn.length === 0;});

		// sort actionable
		actionable.sort(function(itemId1, itemId2) {
			return checklist.items[itemId1].daysToComplete - checklist.items[itemId2].daysToComplete;
		});

		// traverse actionable
		actionable.forEach(function(itemId) {
			visit(itemId).forEach(function(traversedChild) {
				sorted.push(traversedChild);
			});
		});

		return sorted
	}

	return visit('dayZero');
}

router.post('/assign-checklist', function (req, res) {
	var timestamp = new Date().getTime();
	var dayZeroDate = new Date(parseInt(req.body.dayZeroDate));
	var checklist = req.body.checklist;
	checklist.items.dayZero.completedDate = dayZeroDate;
	checklist.items.dayZero.estimatedDueDate = dayZeroDate;
	checklist = addChildrenToChecklist(checklist);
	sorted = getSortedItemIds(checklist);
	
	sorted.forEach(function(itemId) {
		var item = checklist.items[itemId];

		item["itemId"] = itemId;
		item["owner"] = req.user.username;
		item["checklistName"] = checklist.checklistName;
		item["notes"] = req.body.notes;
		item["timestamp"] = timestamp;
		
		item.children.forEach(function(childItemId) {
			var estimatedDueDate = new Date();
			var childItem = checklist.items[childItemId];
			estimatedDueDate.setTime(item.estimatedDueDate.getTime() + childItem.daysToComplete*24*60*60*1000 + 1);
			checklist.items[childItemId].estimatedDueDate = estimatedDueDate;
		})

		if(item.dependsOn.indexOf("dayZero") >= 0) {
			var dueDate = new Date();
			dueDate.setTime(dayZeroDate.getTime() + item.daysToComplete*24*60*60*1000 + 1);
			item["dueDate"] = dueDate;
		};
		items.insert(item);
	});

	setEarliestDueDate(req.user.username, function() {
		res.json({"checklistName": checklist.checklistName, 
			"dayZero": dayZeroDate.toISOString()});
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
			var undone = userItems.filter(function(item) {return !item.completedDate && item.itemId !== 'dayZero'})
									.sort(function(item1, item2) {return item1.estimatedDueDate - item2.estimatedDueDate});
			var done = userItems.filter(function(item) {return item.completedDate && item.itemId !== 'dayZero'})
									.sort(function(item1, item2) {return item1.estimatedDueDate - item2.estimatedDueDate});
			
			var allItems = [];			
			undone.forEach(function(item) {allItems.push(item);});
			done.forEach(function(item) {allItems.push(item);});

			res.json({items: allItems});		
		});
});

router.get('/get-checklists', function(req, res) {
	checklists.find({}, {sort: [["checklistName", 1]]})
		.toArray(function(err, checklists) {
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
