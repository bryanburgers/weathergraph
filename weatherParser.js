SecondGriffin = window.SecondGriffin || { };

(function(ns) {

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

      var t = function(el, i) { return el.childNodes[i].innerText; }

      for (var i = 1; i < datesTr.childNodes.length; i++) {
        console.log(i);
        var date = t(datesTr, i) || lastDate;
        var hour = parseInt(t(hoursTr, i), 10);
        var temp = parseInt(t(tempsTr, i), 10);
        var dewp = parseInt(t(dewpsTr, i), 10);
        var heat = parseInt(t(heatsTr, i) || temp, 10);
	var wind = parseInt(t(windsTr, i), 10);
	var windDir = t(winddTr, i);
	var gustT = t(gustsTr, i);
	var gust = gustT ? parseInt(gustT, 10) : null;

        lastDate = date;

        l.push({
          "day": date,
          "hour": hour,
          "temp": temp,
          "apparent": heat,
          "dew": dewp,
	  "wind": wind,
	  "windDirection": windDir,
	  "gust": gust
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
