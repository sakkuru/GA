var ClientConnector = {};

(function(){

  ClientConnector.start = function() {
    this.ws = new WebSocket("ws://localhost:3000");

    var self = this;
    this.ws.onopen = function(){
      self.setHandler();
    }
  }

  ClientConnector.discovery = function(){
    var discovery = new Discovery();
    var self = this;

    discovery.start(function(res){
      console.dir(res);
      var mesg = {"type": "response", "method": "search", "data": res}
      self.ws.send( JSON.stringify(mesg) );
    }, "urn:schemas-upnp-org:service:AVTransport:1");
  }



  ClientConnector.setHandler = function(){
    var self = this;
    this.ws.onmessage = function(ev){
      var recv = JSON.parse(ev.data);

      if(recv.type !== "request") return;

      console.log("method => "+recv.method);

      switch(recv.method) {
      case "search":
        console.log("start discovery...");
        self.discovery();
        break;
      case "play":
        console.log(recv.media_url);

        if( recv.init === true ||
            tvstat.status === TVSTATUS.INIT ||
            tvstat.status === TVSTATUS.SET ||
            tvstat.status === TVSTATUS.STOP ||
            tvstat.status === TVSTATUS.TERMINATE ){
          Proxy.set(recv.media_url.videoUrl, function(proxyurl){
            if(!!self.av === false) {
              self.av = new AVTransport(recv.avurl);
            } else {
              self.av.url = recv.avurl;
            }
            if(!!self.rc === false) {
              self.rc = new RenderingControl(recv.rcurl);
            } else {
              self.rc.url = recv.rcurl;
            }

            self.rc.getVolume(function(res){
              var volume = res.querySelector("CurrentVolume").textContent;
              console.log("current volume => " + volume);
              var mesg = {"type": "response", "method": "volume", "data": volume};
              self.ws.send(JSON.stringify(mesg));
            });

            self.av.setAVTransportURI(proxyurl, function(ev){
              tvstat.set();
              console.log("succeeded to setAVTransportURI");
              self.av.play(function(ev){
                tvstat.play();
                console.log("succeeded to play");
              });
            });
          });
        } else {
          self.av.play(function(ev) {
            tvstat.play();
            console.log("succeeded to play");
          });
        }

        break;
      case "pause":
        self.av.pause(function(ev){
          tvstat.pause();
          console.log("succeeded to pause");
        })
        break;
      case "stop":
        self.av.stop(function(ev){
          tvstat.stop();
          console.log("succeeded to stop");
        })
        break;
      case "volume":
        self.rc.setVolume(recv.data, function(ev){
          console.log("setVolume succeeded => "+recv.data);
        });
        break;
      default:
        console.log("unknown method => "+recv.method);
      }
    }
  }


  // start Client connector.
  ClientConnector.start();
}());
