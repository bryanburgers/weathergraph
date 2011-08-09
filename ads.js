SecondGriffin = window.SecondGriffin || { };

(function (ns) {

  // These styles are direct from AdMob. They do the trick, I guess. I'm not 100% convinced on having two elements, but oh well.
  var originalStyle = 'position: absolute; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; left: 0px; width:320px;height:48px;';

  var spacerStyle = 'width: 100%; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; position: static; background-image: none; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: initial; height: 48px; background-position: initial initial; background-repeat: initial initial; ';

  var linkStyle = 'width: 100%; height: 100%; padding: 0; margin: 0; display: block; color: white; text-decoration: none;';

  var containerId = 'ad';

  var customAds =
    [ { weight: 4.0, messages: ["Tired of ads?"] }
    , { weight: 0.2, messages: ["Be kind, rewind", "Or something like that"] }
    , { weight: 1.0, messages: ["Cheaper than a Big Mac"] }
    , { weight: 1.0, messages: ["Cheaper than gallon of gas"] }
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

    var div2 = document.createElement('div');
    div2.style.cssText = spacerStyle;

    var a = document.createElement('a');
    a.style.cssText = linkStyle;
    a.href = "https://market.android.com/details?id=com.secondgriffin.WeatherGraph";

    div1.style.backgroundColor = '#48f';
    div1.style.color = "#fff";
    div1.appendChild(a);
    a.innerHTML = "Upgrade to Weather Graph Pro!";

    container.appendChild(div1);
    container.appendChild(div2);

    // Ad flipping
    var ad = chooseCustomAd();
    var messages = ad.messages.slice(0);
    messages.push('Upgrade to Weather Graph Pro!');
    var messageIndex = messages.length - 1;
    var interval = 0;
    var switchAd = function() {
      console.log('Switching');
      messageIndex = (messageIndex + 1) % messages.length;
      a.innerHTML = messages[messageIndex];
    };
    var dispose = function() {
      clearInterval(interval);
    };
    div1.dispose = dispose;
    var interval = setInterval(switchAd, 4000);
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
      console.log("Checking for ad.");
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
