SecondGriffin = window.SecondGriffin || { };


(function(ns) {
  var dewColor = "rgb(0, 153, 0)";
  var heatColor = "rgb(184, 134, 11)";
  var tempColor = "rgb(255, 0, 0)";
  var gustColor = "rgb(0, 0, 102)";
  var windColor = "rgb(153, 0, 153)";
  var windVeinColor = "rgb(102, 102, 102)";
  var skyColor = "rgb(0, 0, 204)";
  var precipColor = "rgb(153, 102, 51)";
  var humidityColor = "rgb(0, 102, 0)";

  var displayDate = function(d) {
    var months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  };

  var convertToKnots = function(i) {
    return i * 0.868976242;
  };

  var drawLine = function(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  var drawPoint = function(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI, 0);
    ctx.fill();
  };

  var drawTextAbove = function(ctx, x, y, text) {
    if (ctx.fillText && ctx.measureText) {
      var measurement = ctx.measureText(text);
      ctx.fillText(text, x - (measurement.width / 2), y - 5);
    }
  };

  var drawTextBelow = function(ctx, x, y, text) {
    if (ctx.fillText && ctx.measureText) {
      var measurement = ctx.measureText(text);
      ctx.fillText(text, x - (measurement.width / 2), y + 15);
    }
  };

  var GraphSettings = function(xBounds, yBounds, rectangle, gridWidth, gridHeight) {
    this.bounds = { "x": xBounds, "y": yBounds };
    this.graphArea = rectangle;
    this.grid = { "width": gridWidth, "height": gridHeight };
  };
  GraphSettings.prototype.translateX = function(i) {
    var tx = (i + 1 - this.bounds.x.min) * this.grid.width + this.graphArea.x; // The actual value.
    return Math.round(tx) - 0.5; // Rendering looks better if it's exactly on a half pixel.
  };
  GraphSettings.prototype.translateY = function(i) {
    var ty = this.graphArea.bottom - ((i - this.bounds.y.min) * this.grid.height); // The actual value.
    return Math.round(ty) - 0.5; // Rendering looks better if it's exactly on a half pixel.
  };

  var Bounds = function(min, max, by) {
    this.min = min;
    this.max = max;
    this.by = by;
  };

  var Rectangle = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.left = x;
    this.bottom = y + height;
    this.right = x + width;
    return this;
  };

  var graph = function(graphCanvas, yAxisCanvas, keyCanvas) {
    this.graphCanvas = graphCanvas;
    this.yAxisCanvas = yAxisCanvas;
    this.keyCanvas = keyCanvas;

    this.logicalMinY = 50;
    this.logicalMaxY = 100;
    this.gridWidth = 50;

    this.logicalMinX = 0;
    this.logicalMaxX = 6;

    this.gridlineColor = "rgb(200, 200, 200)";
    this.outlineColor = "rgb(150, 150, 150)";
    this.textColor = "rgb(0,0,0)";
    this.dayBackground = "rgb(245,245,245)";
    this.nightBackground = "rgb(220,220,220)";

    this.topSpacing = 45;
    this.leftSpacing = 30;
    this.rightSpacing = 10;
    this.bottomSpacing = 0;
    this.horizontalAxisHeight = 40;

    return this;
  };

  graph.TEMPERATURE = 1;
  graph.WIND = 2;
  graph.SKY = 3;

  graph.prototype.getGraphCanvas = function() {
    return this.graphCanvas;
  };
  graph.prototype.getYAxisCanvas = function() {
    return this.yAxisCanvas;
  };
  graph.prototype.getKeyCanvas = function() {
    return this.keyCanvas;
  };

  // Set the width of a grid. This size will be used regardless, and the graph
  // will be allowed to be as big as it wants horizontally.
  graph.prototype.setGridWidth = function(gridWidth) {
    this.gridWidth = gridWidth;
  };

  // Set the maximum height of a grid. This size will be used, unless using
  // it would result in the height of the graph being larger than MaximumVerticalSpace.
  graph.prototype.setMaximumGridHeight = function(gridHeight) {
    this.maximumGridHeight = gridHeight;
  };

  // Set the maximum amount of space the graph can take up.
  graph.prototype.setMaximumVerticalSpace = function(verticalSpace) {
    this.maximumVerticalSpace = verticalSpace;
  };

  graph.prototype.translateX = function(x, rect) {
    var tx = (x + 1 - this.logicalMinX) * this.gridWidth + this.leftSpacing; // The actual value.
    return Math.round(tx) - 0.5; // Rendering looks better if it's exactly on a half pixel.
  };

  graph.prototype.translateY = function(y, rect) {
    var ty = rect.bottom - ((y - this.logicalMinY) * this.yspacing); // The actual value.
    return Math.round(ty) - 0.5; // Rendering looks better if it's exactly on a half pixel.
  };

  graph.prototype.setCanvasSize = function(canvas, ctx, width, height) {
    var dpr = window.devicePixelRatio;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.setAttribute("data-truewidth", width);
    canvas.setAttribute("data-trueheight", height);
    ctx.scale(dpr, dpr);
  };

  graph.prototype.redraw = function(data, mode) {
    var canvas = this.graphCanvas;
    var ctx = canvas.getContext("2d");
    var yAxisCanvas = this.yAxisCanvas;
    var yctx = yAxisCanvas.getContext("2d");
    var keyCanvas = this.keyCanvas;
    var kctx = keyCanvas.getContext("2d");

    var bounds = { "y": new Bounds(0, 100, 10), "x": new Bounds(0, data.length + 1, 1) };
    if (!mode || mode == graph.TEMPERATURE) {
      bounds.y = this.getTemperatureLogicalYBounds(data);
    }
    else if (mode == graph.WIND) {
      bounds.y = this.getWindLogicalYBounds(data);
    }
    else if (mode == graph.SKY) {
      bounds.y = this.getSkyLogicalYBounds(data);
    }

    var canvasWidth = (data.length + 1) * this.gridWidth + this.leftSpacing + this.rightSpacing;
    var canvasHeight = ((bounds.y.max - bounds.y.min) / bounds.y.by) * this.maximumGridHeight + this.topSpacing + this.bottomSpacing + this.horizontalAxisHeight;
    if (canvasHeight + keyCanvas.height > this.maximumVerticalSpace) {
      canvasHeight = this.maximumVerticalSpace - keyCanvas.height;
    }

    this.setCanvasSize(canvas, ctx, canvasWidth, canvasHeight);

    var yAxisCanvasWidth = 40;
    var yAxisCanvasHeight = ((bounds.y.max - bounds.y.min) / bounds.y.by) * this.maximumGridHeight + this.topSpacing + this.bottomSpacing + this.horizontalAxisHeight;
    this.setCanvasSize(yAxisCanvas, yctx, yAxisCanvasWidth, yAxisCanvasHeight);
    var keyCanvasWidth = window.innerWidth;
    var keyCanvasHeight = 22;
    this.setCanvasSize(keyCanvas, kctx, keyCanvasWidth, keyCanvasHeight);
    keyCanvas.style.top = canvasHeight.toString() + "px";

    var rect = new Rectangle(
      this.leftSpacing,
      this.topSpacing,
      canvasWidth - this.leftSpacing - this.rightSpacing,
      canvasHeight - this.topSpacing - this.bottomSpacing - this.horizontalAxisHeight);

    var keyRect = new Rectangle(0, 0, keyCanvasWidth, keyCanvasHeight);

    var graphSettings = new GraphSettings(bounds.x, bounds.y, rect, rect.width / (bounds.x.max - bounds.x.min), rect.height / (bounds.y.max - bounds.y.min));

    ctx.font = "normal 400 14px Verdana, Arial, sans-serif";
    yctx.font = "normal 400 14px Verdana, Arial, sans-serif";
    kctx.font = "normal 400 14px Verdana, Arial, sans-serif";
    this.drawBackground(ctx, data, graphSettings);
    this.drawLines(ctx, data, graphSettings);
    this.drawXAxis(ctx, data, graphSettings);

    var yAxisSuffix = '';

    if (!mode || mode == graph.TEMPERATURE) {
      this.drawTemperatureData(ctx, data, graphSettings);
      this.drawTemperatureKey(kctx, keyRect);
      yAxisSuffix = '\u00b0';
    }
    else if (mode == graph.WIND) {
      this.drawWindData(ctx, data, graphSettings);
      this.drawWindKey(kctx, keyRect);
    }
    else if (mode == graph.SKY) {
      this.drawSkyData(ctx, data, graphSettings);
      this.drawSkyKey(kctx, keyRect);
      yAxisSuffix = '%';
    }

    this.drawYAxis(yctx, data, graphSettings, yAxisSuffix);
  };

  graph.prototype.drawBackground = function(ctx, data, graphSettings) {
    ctx.save();
    var rect = graphSettings.graphArea;

    var gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    ctx.fillStyle = this.dayBackground;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.beginPath();

    // Clip the rectangle, so when we fill the dark for the background
    // it doesn't overflow.
    ctx.moveTo(rect.left, rect.top);
    ctx.lineTo(rect.right, rect.top);
    ctx.lineTo(rect.right, rect.bottom);
    ctx.lineTo(rect.left, rect.bottom);
    ctx.closePath();
    ctx.clip();

    var fillBackground = function(i) {
      var xStart = graphSettings.translateX(i - 0.5, rect);
      var xEnd = graphSettings.translateX(i + 12.5, rect);

      var gradient2 = ctx.createLinearGradient(xStart, 0, xEnd, 0);
      gradient2.addColorStop(0, this.dayBackground);
      gradient2.addColorStop(1/13, this.nightBackground);
      gradient2.addColorStop(12/13, this.nightBackground);
      gradient2.addColorStop(1, this.dayBackground);

      //ctx.fillStyle = "rgb(200,200,200)";
      ctx.fillStyle = gradient2;
      ctx.fillRect(xStart, rect.y, xEnd - xStart, rect.height);

    };

    var startHour = data[0].hour;
    if (startHour >= 18) {
      var i = 18 - data[0].hour;
      fillBackground.apply(this, [i]);
    }
    else if (startHour <= 7) {
      var i = -6 - data[0].hour;
      fillBackground.apply(this, [i]);
    }
    else { } // We're in the daytime, so we don't need to back-draw a night-time background.


    for (var i = 0; data[i]; i++) {
      var hour = data[i].hour;
      if (hour == 18) {
        // Need to use apply so we can have the right 'this', which is used for translateX.
        fillBackground.apply(this, [i]);
      }
    }


    ctx.restore();
  };

  graph.prototype.drawLines = function(ctx, data, graphSettings) {
    ctx.save();

    var rect = graphSettings.graphArea;

    ctx.strokeStyle = this.gridlineColor;
    var startY = Math.floor(graphSettings.bounds.y.min / 10) * 10;
    for (var y = startY; y <= graphSettings.bounds.y.max; y += graphSettings.bounds.y.by) {
      var ty = graphSettings.translateY(y);
      ctx.beginPath();
      ctx.moveTo(graphSettings.graphArea.left, ty);
      ctx.lineTo(graphSettings.graphArea.right, ty);
      ctx.stroke();
    }

    for (var x = 0; x < data.length; x++) {
      var tx = graphSettings.translateX(x);
      ctx.beginPath();
      ctx.moveTo(tx, graphSettings.graphArea.top);
      ctx.lineTo(tx, graphSettings.graphArea.bottom);
      ctx.stroke();
    }

    // Make a border around the graph.
    ctx.strokeStyle = this.outlineColor;
    ctx.beginPath();
    ctx.moveTo(rect.left + 0.5, rect.top - 0.5);
    ctx.lineTo(rect.right - 0.5, rect.top - 0.5);
    ctx.lineTo(rect.right - 0.5, rect.bottom - 0.5);
    ctx.lineTo(rect.left - 0.5, rect.bottom - 0.5);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  };

  graph.prototype.drawXAxis = function(ctx, data, graphSettings) {
    var drawCenteredText = function(ctx, tx, ty, text) {
      if (ctx.fillText && ctx.measureText) {
        var measurement = ctx.measureText(text);
        ctx.fillText(text, tx - (measurement.width / 2), ty);
      }
    };

    var drawLeftAlignedText = function(ctx, tx, ty, text) {
      if (ctx.fillText) {
        ctx.fillText(text, tx, ty);
      }
    };

    ctx.save();

    var translateHour = function(hour) {
      if (hour === 0) return "12 midnight";
      if (hour == 12) return "12 noon";
      if (hour < 12) return hour.toString() + " am";
      return (hour - 12).toString() + " pm";
    };

    for (var i = 0; data[i]; i++) {
      var date = new Date(data[i].date);
      if (date.getUTCHours() % 3 == 1) {
        var tx = graphSettings.translateX(i);
        var ty = graphSettings.graphArea.bottom + 15;
        if (i === 0) {
          // If it's really the first one, then we can't center it, because
          // then our line for the date will cut right though it.
          drawLeftAlignedText(ctx, tx + 2, ty, translateHour(date.getUTCHours()));
        }
        else {
          // Usually, we want our text centered on the line.
          drawCenteredText(ctx, tx, ty, translateHour(date.getUTCHours()));
        }
      }
      if (date.getUTCHours() === 0 || i === 0) {
        var tx = graphSettings.translateX(i);
        var ty = graphSettings.graphArea.bottom + 32;

        if (date.getUTCHours() < 20 && i < data.length - 4) {
          // Only draw the date if it isn't going to overlap the next date (data[i].hour < 20)
          // and as long as we aren't going to run into the end
          // of the graph (i < data.length - 4)
          drawLeftAlignedText(ctx, tx + 3, ty, displayDate(date));
        }

        ctx.save();
        ctx.strokeStyle = this.outlineColor;
        ctx.beginPath();
        ctx.moveTo(tx, graphSettings.graphArea.bottom);
        ctx.lineTo(tx, ty + 5);
        ctx.stroke();
        ctx.restore();
      }
      else if (date.getHours() == 12 && i > 5) {
        // Draw the date again at noon, as long as we didn't
        // just draw the date initially, (i > 4)
        // and as long as we aren't going to run into the end
        // of the graph (i < data.length - 4)
        if (i > 4 && i < data.length - 4) {
          var tx = graphSettings.translateX(i);
          var ty = graphSettings.graphArea.bottom + 32;
          drawLeftAlignedText(ctx, tx + 3, ty, displayDate(date));
        }
      }
    }

    ctx.restore();
  };

  graph.prototype.drawYAxis = function(ctx, data, graphSettings, suffix) {
    var drawRightAlignedText = function(ctx, tx, ty, text) {
      if (ctx.fillText && ctx.measureText) {
        var measurement = ctx.measureText(text);
        ctx.fillText(text, tx - measurement.width, ty);
      }
    };

    var canvasWidth = parseInt(ctx.canvas.getAttribute("data-truewidth"), 10);
    var canvasHeight = parseInt(ctx.canvas.getAttribute("data-trueheight"), 10);

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    ctx.save();

    var startY = Math.floor(graphSettings.bounds.y.min / 10) * 10;
    for (var y = startY; y <= graphSettings.bounds.y.max; y += graphSettings.bounds.y.by) {
      var ty = graphSettings.translateY(y);
      drawRightAlignedText(ctx, canvasWidth - 2, ty + 3, y.toString() + suffix);
    }

    ctx.restore();
  };

  graph.prototype.getTemperatureLogicalYBounds = function(data, rect) {
    if (data.length > 0) {
      var minY = 1000;
      var maxY = -200;
      for (var i = 0; data[i]; i++) {
        var temperature = data[i].temperature;
        var headIndex = data[i].headIndex || data[i].temperature;
        var dewPoint = data[i].dewPoint;

        var max = Math.max(temperature, headIndex, dewPoint);
        var min = Math.min(temperature, headIndex, dewPoint);
        var logMax = Math.ceil((max + 5.5) / 10) * 10;
        var logMin = Math.floor((min - 5.5) / 10) * 10;
        minY = Math.min(minY, logMin);
        maxY = Math.max(maxY, logMax);
      }

      return {
        "min": minY,
        "max": maxY,
        "by": 10
      };
    }
  };

  graph.prototype.setDefaultGraphSettings = function(ctx) {
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    ctx.shadowOffsetX = 0;
  };

  graph.prototype.drawTemperatureData = function(ctx, data, graphSettings) {
    ctx.save();

    this.setDefaultGraphSettings(ctx);

    // Draw lines.
    for (var i = 1; data[i]; i++) {
      var x1, x2, y1, y2;

      // Draw dewPoint line
      x1 = graphSettings.translateX(i - 1);
      x2 = graphSettings.translateX(i);
      y1 = graphSettings.translateY(data[i - 1].dewPoint);
      y2 = graphSettings.translateY(data[i].dewPoint);
      drawLine(ctx, x1, y1, x2, y2, dewColor);

      // Draw heat index line, if necessary
      // Only draw the line if it's different from the temperature line.
      if (data[i].headIndex != data[i].temperature || data[i-1].headIndex != data[i-1].temperature) {
        y1 = graphSettings.translateY(data[i - 1].headIndex);
        y2 = graphSettings.translateY(data[i].headIndex);
        drawLine(ctx, x1, y1, x2, y2, heatColor);
      }

      // Draw temperature line
      y1 = graphSettings.translateY(data[i - 1].temperature);
      y2 = graphSettings.translateY(data[i].temperature);
      drawLine(ctx, x1, y1, x2, y2, tempColor);
    }

    // Draw dots and text
    for (var i = 0; data[i]; i++) {
      ctx.fillStyle = "black";
      var x = graphSettings.translateX(i);
      var dewY, heatY, tempY;

      // Draw dewPoint point, if necessary
      if (data[i].dewPoint != data[i].temperature) {
        dewY = graphSettings.translateY(data[i].dewPoint);
        drawPoint(ctx, x, dewY);
      }

      // Draw heat index point, if necessary
      if (data[i].headIndex != data[i].temperature) {
        heatY = graphSettings.translateY(data[i].headIndex);
        drawPoint(ctx, x, heatY);
      }

      // Draw temperature point
      tempY = graphSettings.translateY(data[i].temperature);
      drawPoint(ctx, x, tempY);

      if (data[i].hour % 3 == 1) {
        // Draw dewPoint text, if necessary
        if (data[i].dewPoint != data[i].temperature) {
    ctx.fillStyle = dewColor;
	  drawTextBelow(ctx, x, dewY, data[i].dewPoint.toString() + '\u00b0');
	}

	if (data[i].headIndex != data[i].temperature) {
	  ctx.fillStyle = heatColor;
	  drawTextAbove(ctx, x, heatY, data[i].headIndex.toString() + '\u00b0');
	}

        ctx.fillStyle = tempColor;
	drawTextAbove(ctx, x, tempY, data[i].temperature.toString() + '\u00b0');
      }
    }

    ctx.restore();
  };

  graph.prototype.drawTemperatureKey = function(ctx, rect) {
    var keyItems = [
      { color: tempColor, name: "Temperature" },
      { color: heatColor, name: "Heat index" },
      { color: dewColor, name: "Dew point" }
    ];
    this.drawKey(ctx, rect, keyItems);
  };

  graph.prototype.getWindLogicalYBounds = function(data, rect) {
    var maxY = 40;
    for (var i = 0; data[i]; i++) {
      var wind = data[i].windSpeed;
      var gust = data[i].gust || 0;

      var max = Math.max(wind, gust);
      var logMax = Math.ceil((max + 5.5) / 10) * 10;
      maxY = Math.max(maxY, logMax);
    }

    return {
      "min": 0,
      "max": maxY,
      "by": 10
    };
  };


  graph.prototype.drawWindData = function(ctx, data, graphSettings) {
    ctx.save();

    this.setDefaultGraphSettings(ctx);

    var drawWindVein = function(ctx, x, y, wind, direction) {
      var knots = convertToKnots(wind);

      ctx.save();
      var rotation = 5;

      switch(direction) {
        case "N":
	  rotation = 0;
	  break;
	case "NNE":
	  rotation = 22.5;
	  break;
	case "NE":
	  rotation = 45;
	  break;
	case "ENE":
	  rotation = 67.5;
	  break;
	case "E":
	  rotation = 90;
	  break;
	case "ESE":
	  rotation = 112.5;
	  break;
	case "SE":
	  rotation = 135;
	  break;
	case "SSE":
	  rotation = 157.5;
	  break;
	case "S":
	  rotation = 180;
	  break;
	case "SSW":
	  rotation = 202.5;
	  break;
	case "SW":
	  rotation = 225;
	  break;
	case "WSW":
	  rotation = 247.5;
	  break;
	case "W":
	  rotation = 270;
	  break;
	case "WNW":
	  rotation = 292.5;
	  break;
	case "NW":
	  rotation = 315;
	  break;
	case "NNW":
	  rotation = 337.5;
	  break;
      }

      ctx.translate(x, y);
      ctx.rotate(Math.PI * rotation / 180);
      ctx.translate(-x, -y);


      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 20);

      if (knots > 0) {
        if (knots <= 5) {
	  ctx.moveTo(x, y - 20);
	  ctx.lineTo(x + 4, y - 20);
	}
	else {
	  ctx.moveTo(x, y - 20);
	  ctx.lineTo(x + 8, y - 20);
	}
      }

      if (knots > 10) {
        if (knots <= 15) {
	  ctx.moveTo(x, y - 18);
	  ctx.lineTo(x + 4, y - 18);
	}
	else {
	  ctx.moveTo(x, y - 18);
	  ctx.lineTo(x + 8, y - 18);
	}
      }

      if (knots > 20) {
        if (knots <= 25) {
	  ctx.moveTo(x, y - 16);
	  ctx.lineTo(x + 4, y - 16);
	}
	else {
	  ctx.moveTo(x, y - 16);
	  ctx.lineTo(x + 8, y - 16);
	}
      }

      ctx.stroke();

      ctx.restore();
    };

    // Draw lines.
    for (var i = 1; data[i]; i++) {
      var x1, x2, y1, y2;

      x1 = graphSettings.translateX(i - 1);
      x2 = graphSettings.translateX(i);

      // Draw gust line
      if (!!data[i - 1].gust && !!data[i].gust) {
        y1 = graphSettings.translateY(data[i - 1].gust);
        y2 = graphSettings.translateY(data[i].gust);
        drawLine(ctx, x1, y1, x2, y2, gustColor);
      }

      // Draw wind line
      y1 = graphSettings.translateY(data[i - 1].windSpeed);
      y2 = graphSettings.translateY(data[i].windSpeed);
      drawLine(ctx, x1, y1, x2, y2, windColor);

    }

    // Draw dots, veins, and text
    for (var i = 0; data[i]; i++) {
      ctx.fillStyle = "black";
      var x = graphSettings.translateX(i);
      var gustY, windY;

      // Draw gust point, if necessary
      if (!!data[i].gust && data[i].gust != data[i].windSpeed) {
        gustY = graphSettings.translateY(data[i].gust);
        drawPoint(ctx, x, gustY);
      }

      // Draw wind vein
      windY = graphSettings.translateY(data[i].windSpeed);
      ctx.strokeStyle = windVeinColor;
      drawWindVein(ctx, x, windY, data[i].windSpeed, data[i].windDirection);

      // Draw wind point
      drawPoint(ctx, x, windY);


      // Draw text
      if (data[i].hour % 3 == 1) {
        // Draw gust text, if necessary
        if (!!data[i].gust && data[i].gust != data[i].windSpeed) {
	  ctx.fillStyle = gustColor;
	  drawTextBelow(ctx, x, gustY, data[i].gust);
	}

        ctx.fillStyle = windColor;
	drawTextBelow(ctx, x, windY, data[i].windSpeed);
      }
    }

    ctx.restore();
  };

  graph.prototype.drawWindKey = function(ctx, rect) {
    var keyItems = [
      { color: windColor, name: "Wind" },
      { color: gustColor, name: "Gusts" },
    ];
    this.drawKey(ctx, rect, keyItems);
  };

  graph.prototype.drawSkyData = function(ctx, data, graphSettings) {
    ctx.save();

    this.setDefaultGraphSettings(ctx);

    // Draw lines.
    for (var i = 1; data[i]; i++) {
      var x1, x2, y1, y2;

      x1 = graphSettings.translateX(i - 1);
      x2 = graphSettings.translateX(i);

      // Draw humidity line
      y1 = graphSettings.translateY(data[i - 1].relativeHumidity);
      y2 = graphSettings.translateY(data[i].relativeHumidity);
      drawLine(ctx, x1, y1, x2, y2, humidityColor);

      // Draw precip line
      y1 = graphSettings.translateY(data[i - 1].precipitation);
      y2 = graphSettings.translateY(data[i].precipitation);
      drawLine(ctx, x1, y1, x2, y2, precipColor);

      // Draw sky cover line
      y1 = graphSettings.translateY(data[i - 1].skyCover);
      y2 = graphSettings.translateY(data[i].skyCover);
      drawLine(ctx, x1, y1, x2, y2, skyColor);
    }

    // Draw dots and text
    for (var i = 0; data[i]; i++) {
      ctx.fillStyle = "black";
      var x = graphSettings.translateX(i);
      var humidityY, precipY, skyY;

      humidityY = graphSettings.translateY(data[i].relativeHumidity);
      precipY = graphSettings.translateY(data[i].precipitation);
      skyY = graphSettings.translateY(data[i].skyCover);

      // Draw relativeHumidity point
      drawPoint(ctx, x, humidityY);

      // Draw precipitation point
      drawPoint(ctx, x, precipY);

      // Draw relativeHumidity point
      drawPoint(ctx, x, skyY);

      // Draw text
      if (data[i].hour % 3 == 1) {
        ctx.fillStyle = humidityColor;
	drawTextAbove(ctx, x, humidityY, data[i].relativeHumidity + '%');

        ctx.fillStyle = precipColor;
	drawTextAbove(ctx, x, precipY, data[i].precipitation + '%');

        ctx.fillStyle = skyColor;
	drawTextAbove(ctx, x, skyY, data[i].skyCover + '%');
      }
    }

    ctx.restore();
  };

  graph.prototype.getSkyLogicalYBounds = function(data, rect) {
    return {
      "min": 0,
      "max": 100,
      "by": 20
    };
  };

  graph.prototype.drawSkyKey = function(ctx, rect) {
    var keyItems = [
      { color: humidityColor, name: "Rel. Humidity" },
      { color: precipColor, name: "Pcpn. Potential" },
      { color: skyColor, name: "Sky Cover" },
    ];
    this.drawKey(ctx, rect, keyItems);
  };

  graph.prototype.drawKey = function(ctx, rect, keyItems) {
    ctx.save();
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

    var initialOffset = 5.5;
    var offset = 15;
    var barWidth = rect.width / keyItems.length;

    var drawText = function(x, y, text, color) {
      if (ctx.fillText && ctx.measureText) {
        var measurement = ctx.measureText(text);
        ctx.fillText(text, x + (barWidth / 2) - (measurement.width / 2), y);
      }
    };
    this.setDefaultGraphSettings(ctx);

    for (var i = 0; keyItems[i]; i++) {
      var y = 10;
      ctx.fillStyle = keyItems[i].color;
      var xLeft = i * barWidth;
      ctx.fillRect(xLeft, rect.top, barWidth, rect.height - 4);
      ctx.fillStyle = "white";
      drawText(xLeft, rect.top + 14, keyItems[i].name);
    }

    ctx.restore();
  };

  graph.prototype.drawData = function(ctx, data, rect) {
    ctx.save();

    var things = [
        { "prop": "dewPoint", "propText": "dewPoint", "color": "rgb(0, 153, 0)" },
        { "prop": "headIndex", "propText": "headIndex", "color": "rgb(184, 134, 11)" },
        { "prop": "temperature", "propText": "temperature", color: "rgb(255, 0, 0)" }
        ];

    for (var t = 0; things[t]; t++) {
      var prop = things[t].prop;
      ctx.strokeStyle = things[t].color;
      ctx.beginPath();

      for (var i = 0; data[i]; i++) {
        var x = this.translateX(i, rect);
        var y = this.translateY(data[i][prop], rect);
        if (i == 0) { ctx.moveTo(x, y); }
        else { ctx.lineTo(x, y); }
      }

      ctx.stroke();
    }

    for (var t = 0; things[t]; t++) {
      var prop = things[t].prop;
      var propText = things[t].propText;

      for (var i = 0; data[i]; i++) {
        var x = this.translateX(i, rect);
        var y = this.translateY(data[i][prop], rect);
        this.drawPoint(ctx, x, y, "rgb(0,0,0)");
        if (data[i].hour % 3 == 1) {
          this.drawText(ctx, data[i][propText].toString(), x, y, things[t].color);
        }
      }
    }

    ctx.restore();
  }

  graph.prototype.drawPoint = function(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  graph.prototype.drawText = function(ctx, text, x, y, color) {
    if (ctx.fillText && ctx.measureText) {
      ctx.save();
      ctx.fillStyle = color;
      var measurement = ctx.measureText(text);
      ctx.fillText(text, x - (measurement.width / 2), y - 5);
      ctx.restore();
    }
  }


  ns.WeatherGraph = graph;
  ns.Rectangle = Rectangle;

})(SecondGriffin);
