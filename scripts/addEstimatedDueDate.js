var MongoClient = require('mongodb').MongoClient;

var url;
var vcapServices;

if (process.env.VCAP_SERVICES) {
  vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  url = vcapServices['mongodb26-swarm'][0].credentials.uri;
} else {
  url = 'mongodb://localhost:27017/checklistomania';
}

MongoClient.connect(url, function (err, db) {
  var items = db.collection('items');
  var users = db.collection('users');
  setTimeout(function () { db.close(); }, 8000);

  // clear all item estimated due date
  items.find({}).toArray(function (itemFindErr, userItems) {
    userItems.forEach(function (item) {
      delete item.estimatedDueDate;
      items.update({ _id: item._id }, item);
    });
  });

  users.find({}).toArray(function (userFindErr, userList) {
    userList.forEach(function (user) {
      console.log('processing ' + user.username); // eslint-disable-line no-console
      items.find({ owner: user.username }).toArray(function (itemFindErr, userItems) {
        if (userItems.length > 0) {
          userItems.forEach(function (item) {
            item.estimatedDueDate = item.dueDate || new Date(2020, 1, 1);
            items.update({ _id: item._id }, item);
          });
        }
      });
    });
  });
});
