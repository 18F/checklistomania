var MongoClient = require('mongodb').MongoClient;

var url;
if(process.env.VCAP_SERVICES) {
	vcapServices = JSON.parse(process.env.VCAP_SERVICES);
	url = vcapServices["mongodb26-swarm"][0].credentials.uri	
} else {
	url = 'mongodb://localhost:27017/checklistomania';
}

function addChildrenToChecklist(checklist) {
	Object.keys(checklist.items).forEach(function(itemId) {checklist.items[itemId].children = []});
	console.log(checklist);
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
		console.log(checklist.items);
		console.log(itemId);
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

MongoClient.connect(url, function(err, db) {
	setTimeout(db.close, 8000);
	items = db.collection("items");
	users = db.collection("users");

	// clear all item estimated due date
	items.find({}).toArray(function(err, userItems) {
		userItems.forEach(function(item) {
			delete item.estimatedDueDate;
			items.update({_id: item._id}, item, {upsert: true});
		})
	});

	users.find({}, function(err, userList) {
		userList.forEach(function(user) {
			items.find({owner: user.username}).toArray(function(err, userItems) {
				if(userItems.length > 0) {
					checklist = {items: {}};

					userItems.forEach(function(item) {
						checklist.items[item.itemId] = item;
					});
					
					checklist = addChildrenToChecklist(checklist);
					sorted = getSortedItemIds(checklist);
					
					sorted.forEach(function(itemId, order) {
						var item = checklist.items[itemId];

						if(itemId == 'dayZero') {item.estimatedDueDate = item.completedDate;}
						
						item.children.forEach(function(childItemId) {
							var estimatedDueDate = new Date();
							var childItem = checklist.items[childItemId];
							console.log(item);
							estimatedDueDate.setTime(item.estimatedDueDate.getTime() + childItem.daysToComplete*24*60*60*1000 + 1);
							checklist.items[childItemId].estimatedDueDate = estimatedDueDate;
						})
						items.update({"_id": item._id}, item, {upsert: true});
					});					
				}
			});
		});
	});
});