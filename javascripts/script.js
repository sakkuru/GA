var logger = function(str){
  var log_ = "["+new Date().getTime() / 1000+"] "+str+"\n"
  $(".debug textarea").prepend(log_);
}

var getAddress = function(callback){
  chrome.socket.getNetworkList(function(lists){
    var addr = null
    lists.forEach(function(list){
      if( list.address.indexOf("169.254.") !== 0 &&
          list.address.indexOf("127.0.1") !== 0 &&
          list.address.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/) ){
        addr = list.address;
      }

      if(typeof(callback) === "function") {
        callback(addr);
      } else {
        console.log(addr);
      }
    });
  });
}

var View = {};


View.DMRs = {
  INIT: 0,
  PLAY: 1,
  PAUSE: 2,
  STOP: 3,
  selector: ".main .dmrs",
  avt: null,  // AVTransport
  avt_urn: "urn:schemas-upnp-org:service:AVTransport:1",
  rc: null, // RenderingControl
  rc_urn: "urn:schemas-upnp-org:service:RenderingControl:1",
  stat: null,
  init: function(str){
    $(this.selector).html(str);
    this.stat = this.INIT;
  },
  update: function(dmrs) {
    $(this.selector).empty();
    var str = ""
    for(var i = 0, l = dmrs.length; i < l; i++) {
      var dmr = dmrs[i];
      str += "<label class='radio'>"
      str += "<input type='radio' name='dmr' data-avturl='"+dmr.controlUrls[this.avt_urn]+"' data-rcurl='"+dmr.controlUrls[this.rc_urn]+"'>"+dmr.friendlyName+"</label>";
    }
    str += "";
    $(this.selector).html(str);

    var self = this;

    $(this.selector).find("input[name=dmr]").click(function(e){

      // AVTransport
      var avturi = $(this).data('avturl');
      logger("AVTranspor URI : "+ avturi);

      if(!!self.avt === false) {
        self.avt = new AVTransport(avturi);
      } else {
        self.avt.url = avturi;
      }
      logger("set control url for AVTransport : "+self.avt.url);

      // Rendering Control
      var rcuri = $(this).data('rcurl');
      logger("RenderingControl URI : "+ rcuri);

      if(!!self.rc === false) {
        self.rc = new RenderingControl(rcuri);
      } else {
        self.rc.url = rcuri;
      }
      logger("set control url for RenderingControl : "+self.avt.url);

      self.rc.getVolume(function(res){
        var volume = res.querySelector("CurrentVolume").textContent;
        logger("current volume => "+volume);
        $("#control .volume").val(volume);
      });

      $("#control button.op").attr("disabled", false);
    });
  },
  set: function(url, callback){
    this.avt.setAVTransportURI(url, callback);
  },
  play: function(url, callback){
    var self = this;
    if(this.stat === this.INIT || this.stat === this.STOP) {
      this.avt.setAVTransportURI(url, function(ev){
        logger("Set AVTransportURL as "+url+" succeeded");
        self.avt.play(callback);
        self.stat = self.PLAY;
      });
    } else {
      this.avt.play(callback);
      this.stat = this.PLAY;
    }
  },
  pause: function(callback){
    this.stat = this.PAUSE;
    this.avt.pause(callback);
  },
  stop: function(callback){
    this.stat = this.STOP;
    this.avt.stop(callback);
  },
  setVolume: function(volume, callback){
    this.rc.setVolume(volume, callback);
  }
}


LAUNCHED = 0;
DO_NOTHING = 0;
PLAYING = 1;
STOPPING = 2;
var appli_status = LAUNCHED;
var device_status = DO_NOTHING;

$(function(){

  //起動回数
  _gaq.push(['_trackEvent', 'Num of times', 'Launched', user_id, 1, true]);

  var msec = 6000;  
  setInterval(function(){
    //アプリ起動時間
    _gaq.push(['_trackEvent', 'Uptime(0.1min)', 'Launched', user_id, 1, false]);

    if (appli_status == PLAYING){
      //動画再生時間
      _gaq.push(['_trackEvent', 'Uptime(0.1min)', 'Playing on Application', user_id, 1, true]);
    }
    if (device_status == PLAYING){
      //動画再生時間
      _gaq.push(['_trackEvent', 'Uptime(0.1min)', 'Playing on Device', user_id, 1, true]);
    }
  }, msec);  
});  

var avt;
$(function(){

  var yc = new youtubeConnector();
  $("form.search").submit(function(e){

    var q = $("form.search input[name=query]").val();
    e.preventDefault();

    _gaq.push(['_trackEvent', 'Click Search button', user_id, q, 1, true]);

    yc.search(q, function(res){
       console.log(res);
       $(".playlists").empty();
       res.forEach(function(v){
         var videourl = null;

         if(!!v.video && v.video instanceof Array) {

           v.video.forEach(function(v_){
             console.log(v_);
             if(v_.quality === "medium" && v_.type.indexOf("video/mp4") === 0) {
              videourl = v_.url;
             }
           });
           console.log(videourl);

           if(videourl === null) return;

           $("<img>").attr("data-id", v.id)
            .attr("data-title", v.title)
            .attr("data-thumbnail_large", v.thumbnail_large)
            .attr("data-description", v.description)
            .attr("data-video", videourl)
            .on("click", function(ev){
              start_video($(this));
            })
            .appendTo(".playlists");

           var thumbnail = v.thumbnail_small;
           getblobURL(v.id, thumbnail, function(id, bloburl) {
             $(".playlists img[data-id="+id+"]").attr("src", bloburl);
           });
         }
       });
    });
  });

  var start_video = function(jqObj){
    appli_status = PLAYING;

    var title = jqObj.data("title")
      , description = jqObj.data("description")
      , id = jqObj.data("id")
      , videourl = jqObj.data("video");
    $(".main").attr("data-video_id", id);
    $(".main .title").text(title);
    $(".main .description").text(description);
    $(".main video").attr("src", videourl);
  }

  var getNextVideoID = function(){
    var curr_id = $(".main").attr("data-video_id")
      , next_id = $(".playlists img[data-id="+curr_id+"]").next().data("id") || $(".playlists img").first().data("id");
    return next_id;
  }

  var dlnatimer
  $(".main button.start").click(function(e){

      if(!!dlnatimer) {
        clearTimeout(dlnatimer);
        dlnatimer = null;
      }

      var device = $(".main input[name=device]:checked");
      e.preventDefault();

      _gaq.push(['_trackEvent', 'Click Start button', user_id, device.val(), 1, true]);

      if(device.val() === "local") {
        start_video($(".playlists img").first());
      } else {
        device_status = PLAYING;
        console.log("dlna devices...");
        var avurl = device.data("avurl")
          , rcurl = device.data("rcurl")
          , cmurl = device.data("cmurl")
        avt = new AVTransport(avurl);

        var firstid = $(".playlists img").first().data("id");

        var start_video_ = function(id){
          var videourl = $(".playlists img[data-id="+id+"]").data("video")
            , title = $(".playlists img[data-id="+id+"]").data("title")
            , description = $(".playlists img[data-id="+id+"]").data("description")
            , thumbnail_large = $(".playlists img[data-id="+id+"]").data("thumbnail_large")

          $(".main").attr("data-video_id", id);
          $(".main .title").text(title);
          $(".main .description").text(description);
          getblobURL(null, thumbnail_large, function(id, bloburl) {
              $(".main img.thumbnail-large").attr("src", bloburl);
          });
          Proxy.set(videourl, function(url) {
            avt.setAVTransportURI(url, function(res){
              avt.play();
              dlnatimer = setTimeout(function(){
                dlnatimer = null;
                avt.stop(function(){
                  start_video_(getNextVideoID());
                });
              }, 30000);
            });
          });
        }
        start_video_(firstid);
      }
  });


  var timer;
  $("video").on("canplay", function(){
    $(this)[0].play();
    timer = setTimeout(function(){
      var nextid = getNextVideoID();
      start_video($(".playlists img[data-id="+nextid+"]"));
    }.bind(this), 45000);
  }).on("ended", function(){
    clearTimeout(timer);
    var nextid = getNextVideoID();
    start_video($(".playlists img[data-id="+nextid+"]"));
  });


  //showCrossOriginImage();
});


// show cross origin images
var getblobURL = function(id, url, callback){
 var xhr = new XMLHttpRequest();
 xhr.open("GET", url);
 xhr.responseType = 'blob';
 xhr.onload = function(e){
   var blob = this.response;
   var blob_url = window.URL.createObjectURL(blob);
   if(typeof(callback) === "function") {
     callback(id, blob_url);
   } else {
     console.log(blob_url);
   }
 }
 xhr.send();
};

var discovery = new Discovery();

discovery.start(function(lists) {
    console.log(lists);
    var t_ = "<label><input type='radio' name='device' class='dlna' data-rcurl='${rcurl}' data-avurl='${avurl}' data-cmurl='${cmurl}' value='${friendlyname}'> ${friendlyname}</label>";
    lists.forEach(function(list){
      var t__ = t_
        .replace("${friendlyname}", list.friendlyName)
        .replace("${friendlyname}", list.friendlyName)
        .replace("${rcurl}", list.controlUrls["urn:schemas-upnp-org:service:RenderingControl:1"])
        .replace("${avurl}", list.controlUrls["urn:schemas-upnp-org:service:AVTransport:1"])
        .replace("${cmurl}", list.controlUrls["urn:schemas-upnp-org:service:ConnectionManager:1"])
      $(t__).appendTo(".main .targets");
    });
}, "urn:schemas-upnp-org:service:AVTransport:1");
