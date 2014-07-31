var http = require('http');
var static = require('node-static');
var url = require('url');

var gp = require('weather-gov-graph-parse');

var file = new static.Server('./httpdocs', { cache: 300 });

function fixDate(obj) {
	var formattedDate = pad(obj.date.getFullYear(), 4) + '-' +
		pad(obj.date.getMonth() + 1) + '-' +
		pad(obj.date.getDate()) + 'T' +
		pad(obj.date.getHours()) + ':' +
		pad(obj.date.getMinutes()) + ':' +
		pad(obj.date.getSeconds());
	obj.date = formattedDate;
	return obj;
}

function pad(t, len) {
	len = len || 2;
	var ret = t.toString();
	while (ret.length < len) {
		ret = '0' + ret;
	}
	return ret;
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
server.listen(port, function(err) {
	if (err) {
		console.log(err);
		console.log(err.stack);
		return;
	}

	console.log("Listening on port " + port);
});
