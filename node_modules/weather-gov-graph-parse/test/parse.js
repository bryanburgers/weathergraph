var assert = require('assert');
var fs = require('fs');
var should = require('should');

var gp = require('../index.js');
var parse = gp.parseOne;

var dump = fs.readFileSync('test/dump.20130816T1259.html');

describe('parse', function() {
	it('should return successfully, promises style', function(done) {
		parse(dump).then(function(data) {
			should.exist(data);
			done();
		}, function(err) {
			should.not.exist(err);
			done();
		});
	});

	it('should return successfully, node style', function(done) {
		parse(dump, function(err, data) {
			should.not.exist(err);
			should.exist(data);
			done();
		});
	});

	it('should return 48 data points', function(done) {
		parse(dump, function(err, data) {
			data.length.should.eql(48);
			done();
		});
	});

	it('each data point should have the right fields', function(done) {
		parse(dump, function(err, data) {
			for (var i = 0; i < data.length; i++) {
				var datum = data[i];

				should.exist(datum);
				assert(datum.date !== undefined, 'data[' + i + '].date should exist');
				assert(datum.temperature !== undefined, 'data[' + i + '].temperature should exist');
				assert(datum.dewPoint !== undefined, 'data[' + i + '].dewPoint should exist');
				assert(datum.heatIndex !== undefined, 'data[' + i + '].heatIndex should exist');
				assert(datum.windSpeed !== undefined, 'data[' + i + '].windSpeed should exist');
				assert(datum.windDirection !== undefined, 'data[' + i + '].windDirection should exist');
				assert(datum.skyCover !== undefined, 'data[' + i + '].skyCover should exist');
				assert(datum.precipitation !== undefined, 'data[' + i + '].precipitation should exist');
				assert(datum.relativeHumidity !== undefined, 'data[' + i + '].relativeHumidity should exist');
				assert(datum.gust !== undefined, 'data[' + i + '].gust should exist');
				assert(datum.heatIndex !== undefined, 'data[' + i + '].heatIndex should exist');
			}
			done();
		});
	});

	it('returns the correct data', function(done) {
		parse(dump, function(err, data) {
			data[0].temperature.should.eql(67);
			data[0].dewPoint.should.eql(59);
			assert(data[0].heatIndex === null, 'data[0].heatIndex should be null');
			data[0].windSpeed.should.eql(9);
			data[0].windDirection.should.eql('SSE');
			assert(data[0].gust === null, 'data[0].gust should be null');
			data[0].skyCover.should.eql(87);
			data[0].precipitation.should.eql(8);
			data[0].relativeHumidity.should.eql(75);

			data[27].temperature.should.eql(80);
			data[27].dewPoint.should.eql(62);
			data[27].heatIndex.should.eql(81);
			data[27].windSpeed.should.eql(16);
			data[27].windDirection.should.eql('S');
			assert(data[27].gust === null, 'data[27].gust should be null');
			data[27].skyCover.should.eql(47);
			data[27].precipitation.should.eql(2);
			data[27].relativeHumidity.should.eql(54);
			done();
		});
	});
});
