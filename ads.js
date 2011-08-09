SecondGriffin = window.SecondGriffin || { };

(function (ns) {

  // These styles are direct from AdMob. They do the trick, I guess. I'm not 100% convinced on having two elements, but oh well.
  var originalStyle = 'position: absolute; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; left: 0px; width:320px;height:48px;';

  var spacerStyle = 'width: 100%; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; position: static; background-image: none; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: initial; height: 48px; background-position: initial initial; background-repeat: initial initial; ';

  var containerId = 'ad';

  document.addEventListener('DOMContentLoaded', function() {
    console.log('Loaded');
    var container = document.getElementById(containerId);
    console.log('Creating');
    var div1 = document.createElement('div');
    div1.style.cssText = originalStyle;
    var div2 = document.createElement('div');
    div2.style.cssText = spacerStyle;

    div1.style.backgroundColor = '#248';
    container.appendChild(div1);
    container.appendChild(div2);
  }, false);

  function fetch() {
    var ad = document.createElement('div');
    var container = document.getElementById(containerId);
    container.appendChild(ad);
    ad.style.display = 'none';
    _admob.fetchAd(ad);
    
    var d = new Date();
    function to() {
      console.log("Checking for ad.");
      if (ad.childNodes.length > 0) {
        // We have an ad, so replace the old ad with the new ad.
        while (container.firstChild != ad) {
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
      }
    }

    // Start waiting for the ad.
    setTimeout(to, 500);
  }

  ns.AdManager = {
    'fetch': fetch
  };
})(SecondGriffin);
