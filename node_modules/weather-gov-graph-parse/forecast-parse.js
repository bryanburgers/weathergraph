"use strict";

var htmlparser = require('htmlparser2');
var Q = require('q');

var SEARCHFORTABLE = 0;
var INTABLE = 1;
var INTR = 2;
var INTD = 3;
var END = 4;

function id(x) {
	return x;
}

function parseInteger(value) {
	return parseInt(value, 10);
}

function parseDate(t) {
	var matches = t.match(/(\d{1,2})\/(\d{1,2})(\/(\d{4}))?/);
	var month = parseInt(matches[1], 10);
	var date = parseInt(matches[2], 10);
	var now = new Date();
	var year = now.getFullYear();

	// If the month is in the past, increment the year.
	// This will most likely be that we're in December,
	// and the date is for January.
	if (now.getMonth() + 1 > month) {
		year = year + 1;
	}

	if (matches[4]) {
		year = parseInt(matches[4], 10);
	}

	var d = new Date(year, month - 1, date);
	return d;
}

function cleanup(data) {
	if (!data.gust) {
		data.gust = null;
	}
	if (!data.heatIndex) {
		data.heatIndex = null;
	}
	return data;
}

var fields = [
	{ name: "date", parse: parseDate },
	{ name: "hour", parse: parseInteger },
	{ name: "temperature", parse: parseInteger },
	{ name: "dewPoint", parse: parseInteger },
	{ name: "heatIndex", parse: parseInteger },
	{ name: "windSpeed", parse: parseInteger },
	{ name: "windDirection", parse: id },
	{ name: "gust", parse: parseInteger },
	{ name: "skyCover", parse: parseInteger },
	{ name: "precipitation", parse: parseInteger },
	{ name: "relativeHumidity", parse: parseInteger }
];

module.exports = function parse(data, callback) {
	var deferred = Q.defer();

	var tablecount = 0;
	var trcount = 0;
	var tdcount = 0;

	var state = SEARCHFORTABLE;
	var lastDate = null;
	var dataParts = [];

	var parser = new htmlparser.Parser({
		onopentag: function _onopentag(tagname, attribs) {
			switch (state) {
				case SEARCHFORTABLE:
					if (tagname === 'table') {
						tablecount++;

						if (tablecount === 8) {
							state = INTABLE;
						}
					}
					break;
				case INTABLE:
					if (tagname === 'tr' && attribs.align && attribs.align === 'center') {
						state = INTR;
					}
					break;
				case INTR:
					if (tagname === 'td') {
						state = INTD;
					}
					break;
			}
		},
		onclosetag: function _onclosetag(tagname) {
			switch (state) {
				case SEARCHFORTABLE:
					if (tagname === 'html') {
						deferred.reject(new Error('Table not found'));
					}
					break;
				case INTABLE:
					if (tagname === 'table') {
						state = END;
						deferred.fulfill(dataParts.map(cleanup));
					}
					break;
				case INTR:
					if (tagname === 'tr') {
						state = INTABLE;
						trcount++;
						tdcount = 0;
					}
					break;
				case INTD:
					if (tagname === 'td') {
						state = INTR;
						tdcount++;
					}
					break;
			}
		},
		ontext: function _ontext(text) {
			switch (state) {
				case INTD:
					var tdc = tdcount;
					var trc = trcount;
					if (trc >= fields.length) {
						trc = trc % fields.length;
						tdc += 25;
					}

					if (tdc === 0 || tdc === 25) {
						// The first TD is the label.
						break;
					}
					tdc--;
					if (tdc >= 25) {
						tdc--;
					}

					var field = fields[trc];

					if (field === null) {
						break;
					}
					else if (field.name === 'date') {
						lastDate = parseDate(text);
					}
					else if (field.name === 'hour') {
						var date = new Date(lastDate.valueOf());
						date.setHours(parseInt(text, 10));
						// Um, this doesn't seem to be working right.

						if (!dataParts[tdc]) {
							dataParts[tdc] = {};
						}
						dataParts[tdc].date = date;
					}
					else {
						var value = field.parse(text);
						if (!dataParts[tdc]) {
							dataParts[tdc] = {};
						}
						dataParts[tdc][field.name] = value;
					}
					break;
			}
		}
	});

	parser.write(data);


	return deferred.promise.nodeify(callback);
};
