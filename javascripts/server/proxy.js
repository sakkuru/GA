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

        console.log(request);

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
