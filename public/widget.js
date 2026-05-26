(function() {
  var script = document.currentScript;
  if (!script) {
    // Try to find the script by src if document.currentScript is not available
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        script = scripts[i];
        break;
      }
    }
  }
  var sauna = script ? (script.getAttribute('data-sauna') || '') : '';
  var baseUrl = script && script.src ? script.src.replace('/widget.js', '') : '';
  
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/#/widget' + (sauna ? '?sauna=' + encodeURIComponent(sauna) : '');
  iframe.style.width = '100%';
  iframe.style.maxWidth = '420px';
  iframe.style.height = '640px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '16px';
  iframe.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
  iframe.title = 'Danholmen Badstuer - Booking';
  
  if (script && script.parentNode) {
    script.parentNode.insertBefore(iframe, script.nextSibling);
  }
})();
