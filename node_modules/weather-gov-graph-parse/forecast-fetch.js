"use strict";

var request = require('request');
var Q = require('q');

module.exports = function fetch(latitude, longitude, hoursAhead) {
	var deferred = Q.defer();

	var url = "http://forecast.weather.gov/MapClick.php?w0=t&w1=td&w2=hi&w3=sfcwind&w3u=1&w4=sky&w5=pop&w6=rh&AheadHour=" + hoursAhead + "&FcstType=digital&textField1=" + latitude + "&textField2=" + longitude;
	request(url, function(error, response, body) {
		if (error) {
			deferred.reject(new Error(error));
		}
		else if (response.statusCode !== 200) {
			deferred.reject(new Error('Status code was not 200'));
		}
		else {
			deferred.resolve(body);
		}
	});

	return deferred.promise;
};
