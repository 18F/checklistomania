var page = require('webpage').create();

var user = {username: 'testUser', _json: {name: 'Test User', avatar_url: 'http://test.png'}};
 
var encodeUrlParameters = function(obj) {
	return Object.keys(obj).map(function(key){ 
  		return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);}).join('&');
};

var serialize = function(obj, prefix) {
  var str = [];
  for(var p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
      str.push(typeof v == "object" ?
        serialize(v, k) :
        encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}

page.open('http://localhost:3000/private/index.html?' + serialize({user: user}), function(status) {
  console.log("Status: " + status);
  if(status === "success") {
    page.render('example.png');
  }
  phantom.exit();
});