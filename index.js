var http = require('http');
var static = require('node-static');
var url = require('url');

var gp = require('./weather-gov-graph-parse');

var file = new static.Server('./httpdocs', { cache: 300 });

function fixDate(obj) {
	obj.date = obj.date.toJSON().replace(/Z$/, '');
	return obj;
}

var server = http.createServer(function(request, response) {

	if (/^\/data/.test(request.url)) {

		var url_parts = url.parse(request.url, true);
		var query = url_parts.query;
		var latitude = query.latitude;
		var longitude = query.longitude;

		if (!latitude || !longitude) {
			response.writeHead(400, {
				'Content-Type': 'application/json'
			});
			response.end(JSON.stringify({
				error: "latitude and longitude required"
			}));
			return;
		}

		gp(latitude, longitude).then(function(data) {
			response.writeHead(200, {
				'Content-Type': 'application/json'
			});
			data = data.map(fixDate);
			response.end(JSON.stringify({ data: data }));
		}).then(null, function(err) {
			response.writeHead(500, {
				'Content-Type': 'application/json'
			});
			response.end(JSON.stringify({
				error: err,
				test: 'yes'
			}));
		});
	}
	else if (request.url == '/') {
		// Home page
		request.on('end', function() {
			file.serveFile('index.html', 200, {}, request, response);
		}).resume();
	}
	else {
		// Any other page.
		request.on('end', function() {
			file.serve(request, response);
		}).resume();
	}
});
var port = process.env.PORT || 2000;
server.listen(port);
