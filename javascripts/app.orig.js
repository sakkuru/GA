var TVSTATUS = {}

TVSTATUS.INIT = 0;
TVSTATUS.SET = 1;
TVSTATUS.PLAY = 2;
TVSTATUS.PAUSE = 3;
TVSTATUS.STOP = 4;
TVSTATUS.TERMINATE = 5;

var TVStat = function(){
  this.status = TVSTATUS.INIT;
  this.mediatype = null;
  this.mediaurl = null;
  this.volume = -1;
}

TVStat.prototype.init = function(){
  this.status = TVSTATUS.INIT;
}
TVStat.prototype.set = function(url, mediatype){
  this.status = TVSTATUS.SET;
  this.mediaurl = url;
  this.mediatype = mediatype;
}
TVStat.prototype.play = function(){
  this.status = TVSTATUS.PLAY;
}
TVStat.prototype.pause = function(){
  this.status = TVSTATUS.PAUSE;
}
TVStat.prototype.stop = function(){
  this.status = TVSTATUS.STOP;
}
TVStat.prototype.terminate = function(){
  this.status = TVSTATUS.TERMINATE;
  this.meditatype = null;
  this.meditaurl = null;
}

TVStat.prototype.setVolume = function(level){
  this.volume = level;
}
TVStat.prototype.stopped = function(){
  return (this.status === TVSTATUS.STOP || this.status === TVSTATUS.TERMINATE);
}

var tvstat = new TVStat();


/**
 * internal webservers
 */

var Controller = {"url": null, "server": null};

(function(){
  var self = Controller;
  self.server = new Server();

  self.avt = new AVTransport();
  self.rc = new RenderingControl();
  self.cd = new ContentDirectory();


  self.server.get('/', function(req, res){
    var ret = {
      "description": "this is controller",
      "urls": {
        "AVTransport": self.avt.url,
        "RenderingControl": self.rc.url,
        "ContentDirectory": self.cd.url
      }
    }

    self.geturl(function(url){
      ret.msearchurl = url+"/msearch/results";

      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      res.send(JSON.stringify(ret));
    });
  });

  self.server.get('/webintents/devices', function(req, res){
    // [FIXME] Discovery is static object that below code means mixturing UDP's receive status.
    // to address this phenomenon, Discovery should not be static object and treat as
    // separate object.
    /*
    Discovery.start(function(data){
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(data))
    }, "urn:schemas-webintents-org:service:WebIntents:1", true);
    */
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.send('{}')
  })

  self.server.get('/server/address', function(req, res){
    self.getaddress(function(addr) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(addr);
    });
  });

  self.server.get('/proxy/set', function(req, res) {
    var url = req.params.url;
    Proxy.set(url, function(proxyurl) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(proxyurl);
    });
  });

  // M-SEARCH features
  ///////////////////////////
  self.server.get('/msearch/results', function(req, res){
    var discovery = new Discovery();
    discovery.start(function(devices){
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      res.send(JSON.stringify(devices))
    })
  })


  // This interface will be obsoleted
  //////////////////////////////////////////
  self.server.get('/set', function(req, res){
    // [todo : enable proxy feature, once try and having error, proxy will work]
    var video_url = req.params.video_url;
    var avcontrol_url  = req.params.avcontrol_url;
    var rendering_url  = req.params.rendering_url;

    self.avt.url = avcontrol_url;
    self.rc.url = rendering_url;
    self.avt.setAVTransportURI(video_url, function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data));
    });
  })

  // AVTransportfeatures
  //////////////////////////////////////////////
  self.server.get('/avtransport/seturl', function(req, res) {
    self.avt.url = req.params.url;
    res.send(self.avt.url);
  });

  self.server.get('/avtransport/setavtransporturi', function(req, res) {
    self.avt.setAVTransportURI(req.params.url, function(data) {
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data));
    }, function(data){
      Util.onerror(res, data);
    });
  });

  self.server.get('/avtransport/setnextavtransporturi', function(req, res) {
    self.avt.setNextAVTransportURI(req.params.url, function(data) {
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data));
    }, function(data){
      Util.onerror(res, data);
    });
  });

  self.server.get('/avtransport/play', function(req, res){
    self.avt.play(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/avtransport/stop', function(req, res){
    self.avt.stop(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/avtransport/pause', function(req, res){
    self.avt.pause(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/avtransport/getmediainfo', function(req, res){
    self.avt.getMediaInfo(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/avtransport/getpositioninfo', function(req, res){
    self.avt.getPositionInfo(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/avtransport/gettransportinfo', function(req, res){
    self.avt.getTransportInfo(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  // RenderingControl features
  //////////////////////////////////////////////
  self.server.get('/renderingcontrol/seturl', function(req, res) {
    self.rc.url = req.params.url;
    res.send(self.rc.url)
  });

  self.server.get('/renderingcontrol/setvolume', function(req, res){
    var level  = req.params.level; // level should 0 to 100
    self.rc.setVolume(level, function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/renderingcontrol/getvolume', function(req, res){
    self.rc.getVolume(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/renderingcontrol/setmute', function(req, res){
    var mute  = req.params.mute; // "on" or "off"
    self.rc.setMute(mute, function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  self.server.get('/renderingcontrol/getmute', function(req, res){
    self.rc.getMute(function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })

  // ContentDirectory features
  //////////////////////////////////////////////
  self.server.get('/contentdirectory/seturl', function(req, res) {
    self.cd.url = req.params.url;
    res.send(self.cd.url);
  });

  self.server.get('/contentdirectory/browse', function(req, res){
    var id  = decodeURIComponent(req.params.id) || 0;
    self.cd.browse(id, function(data){
      res.setHeader("content-type", "application/json; charset=UTF-8");
      res.send(JSON.stringify(data))
    }, function(data){
      Util.onerror(res, data);
    });
  })
  // generic features
  //////////////////////////////////////
  self.server.listen(0, function(err){
    self.geturl();
  });

  self.getaddress = function(callback) {
    chrome.socket.getNetworkList(function(list){
      var address = "";
      list.forEach(function(if_){
        if(if_.address.match(/^\d+\.\d+\.\d+\.\d+$/)) address = if_.address;
      })
      if(typeof(callback) === "function") {
        callback(address);
      } else {
        console.log(address);
      }
    });
  }

  self.geturl = function(callback){
    chrome.socket.getNetworkList(function(list){
      var address = "";
      var url = "http://localhost:"+self.server.port;
      list.forEach(function(if_){
        if(if_.address.match(/^\d+\.\d+\.\d+\.\d+$/)) address = if_.address;
      })
      if(!!address) url = url.replace('localhost', address);
      if(typeof(callback) === "function") {
        callback(url);
      } else {
        console.log(url);
      }
    });
  }
}());

/**
 * Internal WebSocket client process
 *
 */
var WebSocketClient = {};
(function(){
  var self = WebSocketClient;
  // self.SERVER = "ws://localhost:3000"
  self.SERVER = "ws://upnp.komasshu.info"

  self.avt = new AVTransport()
  self.rc = new RenderingControl()
  self.cd = new ContentDirectory()
  self.connected = false

  self.client = new WebSocket(self.SERVER);

  self.client.onopen = function(e){
    console.log("connected to WebSocket server : "+self.SERVER);
    self.connected = true;
  }
  self.client.onclose = function(e){
    console.log("connection closed : "+self.SERVER);
    self.connected = false;
  }

  var send_ = function(method, data) {
    if(!!method === false) return;
    var mesg = {
      "to": "wbdoclient",
      "method": method,
      "data": data
    };

    self.client.send(JSON.stringify(mesg));
  }

  self.client.onmessage = function(e) {
    var mesg = JSON.parse(e.data);
    if(!!mesg.to === false || mesg.to !== "wbdoserver") {
      return;
    }
    switch(mesg.method) {
    case "/msearch/results":
      var discovery = new Discovery();
      discovery.start(function(devices){
        send_(mesg.method, devices);
      });
      break;
    case "/proxy/set":
      var url = mesg.params.url;
      Proxy.set(url, function(proxyurl){
        send_(mesg.method, proxyurl);
      });
      break;
    case "/avtransport/seturl":
      self.avt.url = mesg.params.url;
      send_(mesg.method, self.avt.url);
      break;
    case "/avtransport/setavtransporturi":
      self.avt.setAVTransportURI(mesg.params.url, function(data){
        send_(mesg.method, data);
      });
      break;
    case "/avtransport/setnextavtransporturi":
      self.avt.setNextAVTransportURI(mesg.params.url, function(data){
        send_(mesg.method, data);
      });
      break;
    case "/avtransport/play":
      self.avt.play(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/avtransport/stop":
      self.avt.stop(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/avtransport/pause":
      self.avt.pause(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/avtransport/getmediainfo":
      self.avt.getMediaInfo(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/avtransport/getpositioninfo":
      self.avt.getPositionInfo(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/avtransport/gettransportinfo":
      self.avt.getTransportInfo(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/renderingcontrol/seturl":
      self.rc.url = mesg.params.url;
      send_(mesg.method, self.rc.url);
      break;
    case "/renderingcontrol/setvolume":
      var level = mesg.params.level;
      self.rc.setVolume(level, function(data){
        send_(mesg.method, data);
      });
      break;
    case "/renderingcontrol/getvolume":
      self.rc.getVolume(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/renderingcontrol/setmute":
      var mute = mesg.params.mute;
      self.rc.setMute(mute, function(data){
        send_(mesg.method, data);
      });
      break;
    case "/renderingcontrol/getmute":
      self.rc.getMute(function(data){
        send_(mesg.method, data);
      });
      break;
    case "/contentdirectory/seturl":
      self.cd.url = mesg.params.url;
      send_(mesg.method, self.cd.url);
      break;
    case "/contentdirectory/browse":
      var id  = decodeURIComponent(mesg.params.id) || 0;
      self.cd.browse(id, function(data){
        send_(mesg.method, data);
      });
      break;
    default:
      console.log("unknown method : "+mesg.method);
      break;
    }
  }
}());



var Proxy = {"url": null, "videourl": "", "videohost": "", "videopath": "", "server": null};

/**
 * Proxy implementations
 *
 */
(function(){
  var self = Proxy;

  var CRLF = "\r\n";
  var REQ = [
    '{%method%} {%path%} HTTP/1.1',
  ];

  Proxy.auths = {}; // auths's key = videourl

  // [FIXME] Now, connecting to real server is implemented w/ SOCKET API. but, it should be changed and
  // make use of XMLHTTPRequest. Because it will well work with HTTPS, redirection, etc...
  var proxy_ = function(method, videourl, req, res){
    var arr = videourl.slice(7).split("/")
    var videohost = arr[0], videopath = "/"+arr.slice(1).join("/")
    var bytesRead = 0, bytesSent = 0;

    var a = videohost.split(":")
      , host = a[0]
      , port = (!!a[1] && parseInt(a[1])) || 80
    console.log(host, port);

    // update auths, if exists.
    if(!!req._headers.authorization) {
      self.auths[videourl] = req._headers.authorization;
    }


    chrome.socket.create('tcp', {}, function(createInfo) {
      var sid = createInfo.socketId;
      chrome.socket.connect(sid, host, port, function(e) {
        console.dir(e);
        var request = REQ
          .join(CRLF)
          .replace("{%method%}", method)
          .replace("{%path%}", videopath)
        request += CRLF;

        // append authorization header, if memorized.
        if(!!self.auths[videourl] && !!req._headers.authorization === false) {
          req._headerNames.authorization = "Authorization";
          req._headers.authorization = self.auths[videourl];
        }

        for(var key in req._headerNames) {
          if(!!key === true) {
            request += req._headerNames[key]+": ";

            switch(key) {
            case "host":
              request += videohost+CRLF;
              break;
            case "connection":
              request += "Close"+CRLF;
              break;
            default:
              request += req._headers[key].replace(/\n/g, "").replace(/\r/g, "")+CRLF;
              break;
            }
          }
        }
        request += CRLF;

        // send HTTP Request Header
        chrome.socket.write(sid, encodeToBuffer(request), function(e){
          if(e.bytesWritten < 0) {
            var mesg = "[PROXY] failed to send request to " + host + ":" + port;
            res.send(mesg, 400);
            chrome.socket.destroy(sid);
            return;
          }
          console.log("[PROXY] sent resquest header ===\n"+request);

          // receive HTTP Response Header
          chrome.socket.read(sid, 65535, function(readInfo) {
            console.dir(readInfo);
            if(readInfo.resultCode <= 0) {
              var mesg = "[PROXY] failed to receive response from " + host + ":" + port;
              res.send(mesg, 400);
              chrome.socket.destroy(sid);
              return;
            }

            var headers = decodeFromBuffer(readInfo.data).split("\r\n");

            console.dir("response header from origin server");
            console.dir(headers);
            console.log(headers.join("\n").slice(0,100));

            // If response header includes redirection.
            if(headers[0].indexOf("HTTP/1.1 301") === 0 || headers[0].indexOf("HTTP/1.1 302") === 0) {
              console.log("Now, receive redirection request "+ headers[0]);
              for(var i = 0, l = headers.length; i < l; i += 1) {
                if(headers[i].indexOf("Location: ") === 0) {
                  console.log("Found Location header" + headers[i])
                  var location = headers[i].slice("Location: ".length);
                  chrome.socket.destroy(sid);
                  proxy_(method, location, res);
                  return;
                }
              }

              var mesg = ("[PROXY] Cannot obtain Location header, so simply close this session.");
              res.send(mesg, 400);
              chrome.socket.destroy(sid);
            }
            var read_counter = 1, write_counter = 0;

            // [fixme]  GETが２つ飛んでる・・・ pendingのままになっているので、これをチェック
            //
            var read_ = function() {
              if(tvstat.stopped()){
                res.close();
                chrome.socket.destroy(sid);
                return;
              }
              chrome.socket.read(sid, 65535, function(readInfo) {
                if(readInfo.resultCode > 0) {
                  read_counter++;
                  res.sendraw(readInfo.data, function(writeInfo){
                    read_();
                  });
                  bytesRead += readInfo.resultCode;
                } else {
                  console.log("resultCode <= 0 : " + readInfo.resultCode);
                  res.close();
                  chrome.socket.destroy(sid);
                }
              });
            }
            // Now, assuming 20x headers (that is wrong assumption...)
            // relay received data to client.
            res.sendraw(readInfo.data, function(writeInfo) {
              read_();
            });
            bytesRead += readInfo.resultCode;
            console.log("bytesRead", read_counter, bytesRead);
          });
        });
      });
    });
  }

  // Because of !!0 returns false, without dummy data below logic(check parameters of id) makes error.
  self.videourls = ['prevent 0'];

  self.set = function(url, callback) {
    if(self.videourls.indexOf(url) === -1) {
      self.videourls.push(url);
    }

    self.geturl(function(proxyurl){
      var res = proxyurl + "/media?id="+self.videourls.indexOf(url);

      if(!!callback && typeof(callback) === "function") {
        callback(res);
      } else {
        console.log(res);
      }
    })
  };

  self.server = new Server();

  self.server.get('/', function(req, res) {
    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(self.videourls));
  });

  self.server.get('/media', function(req, res){
    console.dir(req);
    var id = (req.params.id && parseInt(req.params.id)) || false;
    if(!!id === false && !!self.videourls[id] === false) {
      res.render("video url doesn't set");
      return;
    }
    proxy_('GET', self.videourls[id], req, res)
  });

  self.server.head('/media', function(req, res){
    var id = (req.params.id && parseInt(req.params.id)) || false;
    if(!!id === false && !!self.videourls[id] === false) {
      res.render("video url doesn't set");
      return;
    }
    console.log("head");
    proxy_('HEAD', self.videourls[id], req, res)
  });

  self.server.listen(0, function(err){
  });

  self.geturl = function(callback){
    chrome.socket.getNetworkList(function(list){
      var address = "";
      var url = "http://localhost:"+self.server.port;
      list.forEach(function(if_){
        if(if_.address.match(/^\d+\.\d+\.\d+\.\d+$/)) address = if_.address;
      })
      if(!!address) url = url.replace('localhost', address);
      if(!!callback && typeof(callback) === "function") {
        callback(url);
      } else {
        console.log(url);
      }
    });
  }
}())

// for debug
setTimeout(function(e){
  var url = "http://127.0.0.1:3000/musics/test.mp3";
  console.log(url);
  Proxy.set(url);
}, 500);
