var logger = function(str){
  var log_ = "["+new Date().getTime() / 1000+"] "+str+"\n"
  $(".debug textarea").prepend(log_);
}

var getAddress = function(callback){
  chrome.socket.getNetworkList(function(lists){
    var addr = null
    lists.forEach(function(list){
      if( list.address.indexOf("169.254.") !== 0 &&
          list.address.indexOf("127.0.0.1") !== 0 &&
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
var discovery = new Discovery();

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



$(function(){
  getAddress(function(addr){
    $("#control .media-url").val("http://"+addr+":3000/videos/miku.mp4");
    $(".debug video").attr("src", "http://"+addr+":3000/videos/miku.mp4");
  });

  $("#m-search").click(function(ev) {
    logger("Start M-SEARCH ....");
    View.DMRs.init("<img src='/images/ajax-loader.gif'> Start discovering...");
    discovery.start(function(res){
      console.dir(res);
      logger("M-SEARCH finished .... found "+res.length+" DMRs");
      View.DMRs.update(res);
    }, "urn:schemas-upnp-org:service:AVTransport:1");
  });

  $("#control .set").click(function(){
    var media_url = $("#control .media-url").val();
    if(!!media_url === false) {
      logger("Media url is now empty");
      alert("Media url is now empty");
      return;
    }
    View.DMRs.set(media_url, function(res) {
      console.dir(res);
      logger("Set AVTransportURL as "+media_url+" succeeded");
    });
  });

  $("#control .play").click(function(){
    var media_url = $("#control .media-url").val();
    if(!!media_url === false) {
      logger("Media url is now empty");
      alert("Media url is now empty");
      return;
    }
    View.DMRs.play(media_url, function(res){
      console.dir(res);
      logger("Play succeeded");
    });
  });

  $("#control .stop").click(function(){
    View.DMRs.stop(function(res){
      console.dir(res);
      logger("Stop succeeded");
    });
  });

  $("#control .pause").click(function(){
    View.DMRs.pause(function(res){
      console.dir(res);
      logger("Pause succeeded");
    });
  });

  $("#control .volume").change(function(e){
    var volume = $(this).val();
    View.DMRs.setVolume(volume, function(res){
      console.log(res);
      logger("Volume changed => " + volume);
    });
  });

});
