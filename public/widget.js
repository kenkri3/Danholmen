// Danholmen Badstue Booking Widget
// Usage: <script src="https://your-domain.com/widget.js" data-sauna="ormelet-vel"></script>

(function() {
  // 1. Find the script tag
  var script = document.currentScript;
  if (!script) {
    // Fallback: find script by src containing 'widget.js'
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        script = scripts[i];
        break;
      }
    }
  }

  var saunaSlug = script && script.getAttribute('data-sauna') ? script.getAttribute('data-sauna') : '';

  // 2. Detect base URL from script src
  var baseUrl = '';
  if (script && script.src) {
    var src = script.src;
    var idx = src.indexOf('/widget.js');
    if (idx !== -1) {
      baseUrl = src.substring(0, idx);
    }
  }
  if (!baseUrl) {
    baseUrl = 'https://ixkmam3b2zen6.kimi.page';
  }

  // 3. Create iframe
  var iframe = document.createElement('iframe');
  var widgetPath = baseUrl + '/#/widget' + (saunaSlug ? '?sauna=' + encodeURIComponent(saunaSlug) : '');
  iframe.src = widgetPath;
  iframe.style.width = '100%';
  iframe.style.maxWidth = '420px';
  iframe.style.height = '640px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '16px';
  iframe.style.boxShadow = '0 10px 40px rgba(0,0,0,0.12)';
  iframe.style.overflow = 'hidden';
  iframe.title = 'Badstue Booking Widget';
  iframe.scrolling = 'no';

  // 4. Insert after script tag
  if (script && script.parentNode) {
    script.parentNode.insertBefore(iframe, script.nextSibling);
  } else {
    // Fallback: append to body
    document.body.appendChild(iframe);
  }
})();
