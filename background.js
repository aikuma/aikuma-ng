chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'outerBounds': {width: 1280, height: 768, minWidth: 960},
    'state': 'maximized'
  });
});
