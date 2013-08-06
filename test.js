var fs = require('fs');
var fetch = require('./forecast-fetch');
var parse = require('./forecast-parse');
var gp = require('./weather-gov-graph-parse');

/*
var content = fs.readFileSync('test.html', 'utf-8');
parse(content).then(function(data) {
	console.log(data[0]);
}, function(err) {
	console.log(err);
});
*/

/*
fetch(43.54420, -96.7301, 0).then(function(data) {
	console.log(data);
}, function(err) {
	console.log(err);
});
*/

/*
fetch(43.54420, -96.7301, 0).then(parse).then(function(data) {
	console.log(data[0]);
}).then(null, function(err) {
	console.log(err);
});
*/


gp(43.54420, -96.7301).then(function(data) {
	//console.log(data);
}).then(null, function(err) {
	console.log(err);
});
