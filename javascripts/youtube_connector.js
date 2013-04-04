// youtube_connector.js

var youtubeConnector;

(function(){
  // change request header
  var UA = "Mozilla/5.0(iPad; U; CPU OS 4_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8F191 Safari/6533.18.5";

  // var description = null;

  // var requestFilter = {
  //   urls: ["*://m.youtube.com/*"],
  //   types:[
  //     "xmlhttprequest"
  //   ]
  // },
  // extraInfoSpec = ['requestHeaders', 'blocking'],

  // handler = function (details) {
  //   if (UA == null) {
  //     return;
  //   }
  //   var uaFound = false;
  //   for (var i = 0, l = details.requestHeaders.length; i < l; ++i) {
  //     if (details.requestHeaders[i].name == 'User-Agent') {
  //       details.requestHeaders[i].value = UA;
  //       uaFound = true;
  //       break;
  //     }
  //   }

  //   if(!uaFound){
  //     details.requestHeaders.push({
  //       name: "User-Agent",
  //       value: UA
  //     });
  //   }
  //   return {requestHeaders:details.requestHeaders};
  // };

  // chrome.webRequest.onBeforeSendHeaders.addListener(handler, requestFilter, extraInfoSpec);
  // [FINISH]


  // [BEGIN youtubeConnector definitiion]
  youtubeConnector = function(){
  }

  youtubeConnector.prototype.search = function(query, callback){
    if(!!query === false) throw("query must be specified");
    if(typeof(query) !== "string") throw("query must be string");

    this.callback = callback;

    var xhr = new XMLHttpRequest()
      , url = "http://gdata.youtube.com/feeds/api/videos?vq=#{query}&alt=json".replace("#{query}", encodeURIComponent(query));
    xhr.open("GET", url);

    xhr.onload = this.parseSearchResults.bind(this, xhr);

    xhr.send();
  }

  youtubeConnector.prototype.parseSearchResults = function(res) {
    console.log(res);
    if(res.status === 200) {
      var entries = JSON.parse(res.responseText).feed.entry;
      console.dir(entries);
      this.lists = entries.map(function(e){
          return {
            "id" : e.id["$t"].match(/\/([0-9a-zA-Z_-]+)$/)[1],
            "title" : e["title"]["$t"],
            "description": e["media$group"]["media$description"]["$t"],
            "thumbnail_large": e["media$group"]["media$thumbnail"][0].url,
            "thumbnail_small": e["media$group"]["media$thumbnail"][2].url,
            "duration": e["media$group"]["yt$duration"]["seconds"]
          }
      });
      console.dir(this.lists);
      this.getmpeg4url();
    } else {
      throw("Error while retrieving youtube urls");
    }
  }

  youtubeConnector.prototype.getmpeg4url = function(){
    console.log(this.lists);
    var c = 0;
    this.lists.forEach(function(list){
      // packaged apps v2 doesn't permit to use webrequest, so can't change User-Agent header
      // should use socket api.
      var url = "http://m.youtube.com/watch?ajax=1&layout=mobile&tsp=1&utcoffset=540&v=" + list.id + "&preq=";

      new httpClient({url: url}, function(res){
        c++;
        var video_ = JSON.parse(res.slice(4)).content.video;
        this.lists.forEach(function(l_){
          if(l_.id === video_.encrypted_id) l_.video = video_.fmt_stream_map;
        });
        if( c === this.lists.length ) {
          if(typeof(this.callback) === "function") {
            this.callback(this.lists);
          } else {
            console.log(this.lists);
          }
        }
      }.bind(this));
    }.bind(this));
  }
}());


// test scenario
//var yc = new youtubeConnector();
//yc.search("NTTコミュニケーションズ", function(res){
//    console.log("res", res);
//    });
