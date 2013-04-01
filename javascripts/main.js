var appWindow;

chrome.app.runtime.onLaunched.addListener(function(data){
  chrome.app.window.create('main.html', {
    width: 1024,
    height: 820
  }, function(w){
    appWindow = w;
  });
});
