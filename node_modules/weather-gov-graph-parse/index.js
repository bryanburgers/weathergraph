"use strict";

var Q = require('q');

var fetch = require('./forecast-fetch');
var parse = require('./forecast-parse');

function weatherGovGraphParser(latitude, longitude, callback) {
	return Q.all([
		// weather.gov has data in 2-day increments, but has data up to six
		// days in advance.
		fetch(latitude, longitude, 0).then(parse),
		fetch(latitude, longitude, 48).then(parse),
		fetch(latitude, longitude, 96).then(parse)
	]).then(function(data) {
		var arr = [];
		for (var i = 0; i < data.length; i++) {
			arr = arr.concat(data[i]);
		}
		return arr;
	}).nodeify(callback);
}

weatherGovGraphParser.fetchOne = fetch;
weatherGovGraphParser.parseOne = parse;
module.exports = weatherGovGraphParser;
