SecondGriffin = window.SecondGriffin || { };

(function(ns) {

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
      year = parseInt(matches[4]);
    }

    var d = new Date();
    d.setFullYear(year);
    d.setMonth(month - 1);
    d.setDate(date);
    return d;
  }

  var WeatherParser = function() {};
  WeatherParser.prototype.parse = function(str) {
    var newDoc = document.implementation.createHTMLDocument();
    newDoc.documentElement.innerHTML = str;

    var l = [];
    var lastDate = null;

    var parseTable = function(firstTr) {
      var datesTr = firstTr.nextElementSibling;
      var hoursTr = datesTr.nextElementSibling;
      var tempsTr = hoursTr.nextElementSibling;
      var dewpsTr = tempsTr.nextElementSibling;
      var heatsTr = dewpsTr.nextElementSibling;
      var windsTr = heatsTr.nextElementSibling;
      var winddTr = windsTr.nextElementSibling;
      var gustsTr = winddTr.nextElementSibling;
      var skycvTr = gustsTr.nextElementSibling;
      var preciTr = skycvTr.nextElementSibling;
      var relhuTr = preciTr.nextElementSibling;

      var t = function(el, i) { return el.childNodes[i].innerText; }

      for (var i = 1; i < datesTr.childNodes.length; i++) {
        var date = t(datesTr, i) || lastDate;
        var hour = parseInt(t(hoursTr, i), 10);
        var temp = parseInt(t(tempsTr, i), 10);
        var dewp = parseInt(t(dewpsTr, i), 10);
        var heat = parseInt(t(heatsTr, i) || temp, 10);
	var wind = parseInt(t(windsTr, i), 10);
	var windDir = t(winddTr, i);
	var gustT = t(gustsTr, i);
	var gust = gustT ? parseInt(gustT, 10) : null;
	var skyCover = parseInt(t(skycvTr, i), 10);
	var precPot = parseInt(t(preciTr, i), 10);
	var humidity = parseInt(t(relhuTr, i), 10);

        lastDate = date;
	var parsedDate = parseDate(date);

        l.push({
          "day": parsedDate.toLocaleDateString(),
          "hour": hour,
          "temp": temp,
          "apparent": heat,
          "dew": dewp,
	  "wind": wind,
	  "windDirection": windDir,
	  "gust": gust,
	  "skyCover": skyCover,
	  "precip": precPot,
	  "humidity": humidity
        });
      }
    }

    var elements = newDoc.getElementsByTagName("td");
    var firstTr = null;
    for (var i = 0; elements[i]; i++) {
      if (elements[i].getAttribute("colspan") == "25") {
        firstTr = elements[i].parentNode;
        parseTable(firstTr);
      }
    }

    return l;
  }



  ns.WeatherParser = WeatherParser;  

})(SecondGriffin);
