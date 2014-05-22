# weather.gov graph parser

Parse data from weather.gov's weather graph.

[![Build Status](https://travis-ci.org/bryanburgers/weather-gov-graph-parse.png?branch=master)](https://travis-ci.org/bryanburgers/weather-gov-graph-parse)

[![NPM](https://nodei.co/npm/weather-gov-graph-parse.png?compact=true)](https://npmjs.org/package/weather-gov-graph-parse)

## Installation

```
npm install weather-gov-graph-parse
```

## Usage

Require the module.

```
var gp = require('weather-gov-graph-parse');
```

Fetch and parse the weather graph.

```
gp(pos.latitude, pos.longitude, function(err, data) {
	// data is an array of data points
});
```

Or fetch and parse the weather graph, promises style.

```
gp(pos.latitude, pos.longitude).then(function(data) {
	// data is an array of data points
});
```

## Data

The `data` variable that is returned is an array of data points. Each data
point has the following structure. All fields are always present unless
otherwise noted.

```
{
	// The date of the prediction data point.
	date: [date]

	// The predicted temperature.
	temperature: number

	// The predicted dew point.
	dewPoint: number

	// The predicted heat index, if available. This may be 'null' if no heat
	// index is available. The weather.gov weather graph assumes that if no
	// heat index is available, it is the same as the temperature.
	heatIndex: number

	// The predicted wind speed.
	windSpeed: number

	// The predicted wind direction. This will be either 'N', 'NNE', 'NE',
	// 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW',
	// 'NW', or 'NNW'
	windDirection: string

	// The maximum predicted wind gusts, if available. This may be 'null' if
	// no gusts are predicted.
	gust: number

	// The predicted sky cover, in percent. This will be between 0 and 100.
	skyCover: number

	// The predicted precipitation potential. This will be between 0 and 100.
	precipitation: number

	// The predicted relative humidity. This will be between 0 and 100.
	relativeHumidity: number
}
```
