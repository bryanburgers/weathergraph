SecondGriffin = window.SecondGriffin || { };

(function (ns) {

  var originalStyle = 'margin:0;padding:0;width:320px;height:48px;';

  var linkStyle = 'width: 100%; height: 100%; padding: 0; margin: 0; display: block; color: white; text-decoration: none; background: #48f url("img/adgradient.png") repeat-x left top;';

  var containerId = 'ad';

  var customAds =
    [ { weight: 4.0, messages: ["Tired of ads?"] }
    , { weight: 1.0, messages: ["Cheaper than a Big Mac."] }
    , { weight: 1.0, messages: ["Cheaper than gallon of gas."] }
    , { weight: 0.2, messages: ["Faster than a speeding bullet", "Oh wait, that's Superman"] }
    ]

  function chooseCustomAd() {
    var sum = 0;
    for (var i = 0; i < customAds.length; i++) {
      sum += customAds[i].weight;
    }
    var r = Math.random() * sum;
    for (var i = 0; i < customAds.length; i++) {
      var ad = customAds[i];
      if (r < ad.weight) {
        return ad;
      }
      else {
        r -= ad.weight;
      }
    }
    return null;
  }

  document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById(containerId);

    var div1 = document.createElement('div');
    div1.style.cssText = originalStyle;

    //var div2 = document.createElement('div');
    //div2.style.cssText = spacerStyle;

    var a = document.createElement('a');
    a.style.cssText = linkStyle;
    a.href = "https://market.android.com/details?id=com.secondgriffin.WeatherGraph";
    var img = document.createElement('img');
    img.width = 36;
    img.height = 36;
    img.src = 'img/icon_36.png';
    img.style.margin = "6px";
    img.style.float = "left";
    var span = document.createElement('span');
    span.appendChild(document.createTextNode("Upgrade to Weather Graph Pro!"));
    span.style.lineHeight = "48px";
    span.style.position = 'absolute';
    a.appendChild(img);
    a.appendChild(span);

    div1.appendChild(a);

    container.appendChild(div1);

    // Ad flipping
    var ad = chooseCustomAd();
    var messages = ad.messages.slice(0);
    messages.push('Upgrade to Weather Graph Pro!');
    var messageIndex = messages.length - 1;
    var interval = 0;
    var switchAd = function() {
      messageIndex = (messageIndex + 1) % messages.length;
      var message = messages[messageIndex];

      if (span.style.webkitTransition == null) {
        // If we can't do fancy webkit transitions, just
	// replace the contents of the span.
        span.innerHTML = message;
      }
      else {
        // We can do fancy webkit transitions. Therefore, we
	// need to have two spans, and scroll them both down.
        var oldSpan = span;
        span = document.createElement('span');
	span.style.webkitTransform = 'translate(0px, -48px)';
	span.style.opacity = '0';
	span.style.webkitTransition = 'all 1s ease';
	span.style.position = 'absolute';
	span.style.lineHeight = '48px';
	oldSpan.style.webkitTransition = 'all 1s ease';
	span.innerHTML = message;
	a.appendChild(span);
	setTimeout(function() {
	  span.style.webkitTransform = '';
	  span.style.opacity = '';
          oldSpan.style.webkitTransition = 'all 1s ease';
	  oldSpan.style.opacity = '0';
	  oldSpan.style.webkitTransform = 'translate(0px, 48px)';
	  // When the transition is done, remove the span (so we don't end up with tons of them)
	  oldSpan.addEventListener('webkitTransitionEnd', function(e) {
	    if (e.propertyName == '-webkit-transform') {
	      a.removeChild(oldSpan);
	    }
	  }, false);
	}, 100);
      }
    };
    var dispose = function() {
      clearInterval(interval);
    };
    div1.dispose = dispose;
    var interval = setInterval(switchAd, 6000);
    switchAd();
  }, false);

  function fetch() {
    var ad = document.createElement('div');
    var container = document.getElementById(containerId);
    container.appendChild(ad);
    ad.style.display = 'none';
    var adResult = _admob.fetchAd(ad);
    
    var d = new Date();
    function to() {
      if (adResult.adEl.height == 48) {
        // We have an ad, so replace the old ad with the new ad.
        while (container.firstChild != ad) {
	  if (container.firstChild.dispose) {
	    container.firstChild.dispose();
	  }
          container.removeChild(container.firstChild);
        }
        ad.style.display = "block";
      }
      else {
        // We don't have an ad yet. If we haven't been waiting for
	// more than 10 s, wait longer.

        if (new Date() - d < 10000) {
          setTimeout(to, 500);
        }
	else {
	  container.removeChild(ad); // Remove the child since we failed to get anything worthwhile
	}
      }
    }

    // Start waiting for the ad.
    setTimeout(to, 500);
  }

  ns.AdManager = {
    'fetch': fetch
    ,'chooseCustomAd': chooseCustomAd
  };
})(SecondGriffin);
