var appWindow;

chrome.app.runtime.onLaunched.addListener(function(data){
  chrome.app.window.create('main.html', {
    width: 824,
    height: 800
  }, function(w){
    appWindow = w;
  });
});
