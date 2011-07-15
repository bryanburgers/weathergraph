SecondGriffin = window.SecondGriffin || { };


(function(ns) {
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
  }

  var graph = function(graphCanvas, yAxisCanvas) {
    this.graphCanvas = graphCanvas;
    this.yAxisCanvas = yAxisCanvas;
    this.logicalMinY = 50;
    this.logicalMaxY = 100;

    this.logicalMinX = 0;
    this.logicalMaxX = 6;

    this.gridlineColor = "rgb(200, 200, 200)";
    this.outlineColor = "rgb(150, 150, 150)";
    this.textColor = "rgb(0,0,0)";

    return this;
  };

  graph.prototype.getGraphCanvas = function() {
    return this.graphCanvas;
  }
  graph.prototype.getYAxisCanvas = function() {
    return this.yAxisCanvas;
  }

  graph.prototype.setLogicalYBounds = function(min, max) {
    this.logicalMinY = min;
    this.logicalMaxY = max;
  }
  graph.prototype.setLogicalXBounds = function(min, max) {
    this.logicalMinX = min;
    this.logicalMaxX = max;
  }

  graph.prototype.translateX = function(x, rect) {
    var tx = (x + 1 - this.logicalMinX) * this.xspacing; // The actual value.
    return Math.round(tx) - 0.5; // Rendering looks better if it's exactly on a half pixel.
  };

  graph.prototype.translateY = function(y, rect) {
    var ty = rect.bottom - ((y - this.logicalMinY) * this.yspacing); // The actual value.
    return Math.round(ty) - 0.5; // Rendering looks better if it's exactly on a half pixel.
  };

  graph.prototype.redraw = function(data) {
    var canvas = this.graphCanvas;
    var ctx = canvas.getContext("2d");
    var yAxisCanvas = this.yAxisCanvas;
    var yctx = yAxisCanvas.getContext("2d");

    var rect = new Rectangle(0, 10, canvas.width, canvas.height - 40);

    this.xspacing = rect.width / (this.logicalMaxX - this.logicalMinX + 2);
    this.yspacing = rect.height / (this.logicalMaxY - this.logicalMinY);

    // Really no need to clip, since we keep our gridlines in the bounds, anyway.
/*
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rect.left, rect.top);
    ctx.lineTo(rect.right, rect.top);
    ctx.lineTo(rect.right, rect.bottom);
    ctx.lineTo(rect.left, rect.bottom);
    ctx.closePath();
    ctx.clip();
*/

    this.drawLines(ctx, data, rect);
    this.drawData(ctx, data, rect);

    ctx.restore();

    this.drawXAxis(ctx, data, rect);
    this.drawYAxis(yctx, data, rect);
  };

  graph.prototype.drawLines = function(ctx, data, rect) {
    ctx.save();
    var gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, "rgb(230, 230, 230)");
    gradient.addColorStop(0.4, "rgb(245, 245, 245)");
    gradient.addColorStop(0.6, "rgb(245, 245, 245)");
    gradient.addColorStop(1, "rgb(230, 230, 230)");
    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    ctx.strokeStyle = this.gridlineColor;
    var startY = Math.floor(this.logicalMinY / 10) * 10;
    for (var y = startY; y <= this.logicalMaxY; y += 10) {
      var ty = this.translateY(y, rect);
      ctx.beginPath();
      ctx.moveTo(rect.left, ty);
      ctx.lineTo(rect.right, ty);
      ctx.stroke();
    }

    for (var x = 0; x < data.length; x++) {
      var tx = this.translateX(x, rect);
      ctx.beginPath();
      ctx.moveTo(tx, rect.top);
      ctx.lineTo(tx, rect.bottom);
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
  }

  graph.prototype.drawXAxis = function(ctx, data, rect) {
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
      if (hour == 0) return "12 midnight";
      if (hour == 12) return "12 noon";
      if (hour < 12) return hour.toString() + " am";
      return (hour - 12).toString() + " pm";
    }

    for (var i = 0; data[i]; i++) {
      if (data[i].hour % 3 == 1) {
        var tx = this.translateX(i, rect);
        var ty = rect.bottom + 10;
        if (i == 0) {
          // If it's really the first one, then we can't center it, because
          // then our line for the date will cut right though it.
          drawLeftAlignedText(ctx, tx + 2, ty, translateHour(data[i].hour));
        }
        else {
          // Usually, we want our text centered on the line.
          drawCenteredText(ctx, tx, ty, translateHour(data[i].hour));
        }
      }
      if (data[i].hour == 0 || i == 0) {
        var tx = this.translateX(i, rect);
        var ty = rect.bottom + 22;
        drawLeftAlignedText(ctx, tx + 3, ty, data[i].day);

        ctx.save();
        ctx.strokeStyle = this.outlineColor;
        ctx.beginPath();
        ctx.moveTo(tx, rect.bottom);
        ctx.lineTo(tx, ty + 5);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  };

  graph.prototype.drawYAxis = function(ctx, data, rect) {
    var drawRightAlignedText = function(ctx, tx, ty, text) {
      if (ctx.fillText && ctx.measureText) {
        var measurement = ctx.measureText(text);
        ctx.fillText(text, tx - measurement.width, ty);
      }
    };    

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    ctx.save();    

    var startY = Math.floor(this.logicalMinY / 10) * 10;
    for (var y = startY; y <= this.logicalMaxY; y += 10) {
      var ty = this.translateY(y, rect);                 
      drawRightAlignedText(ctx, 25, ty + 3, y.toString());
    }

    ctx.restore();
  };

  graph.prototype.drawData = function(ctx, data, rect) {
    ctx.save();

    var things = [
        { "prop": "dew", "propText": "dew", "color": "rgb(0, 153, 0)" },
        { "prop": "apparent", "propText": "apparent", "color": "rgb(184, 134, 11)" },
        { "prop": "temp", "propText": "temp", color: "rgb(255, 0, 0)" }        
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