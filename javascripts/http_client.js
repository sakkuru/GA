var httpClient;

(function(){
 var UA = "Mozilla/5.0(iPad; U; CPU OS 4_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8F191 Safari/6533.18.5";
  httpClient = function(option, successCallback, errorCallback){
    // [TODO] option should have url...
    this.url = option.url;
    if(!!this.url === false) throw("url must specified!!");

    this.protocol = this.url.split("/")[0].slice(0, -1);
    this.host = this.url.split("/")[2]; // [FIXME]
    this.port = 80; // [FIXME]
    this.path = "/" + this.url.split("/").slice(3).join("/")

    this.successCallback = successCallback;
    this.errorCallback = errorCallback;


    chrome.socket.create("tcp", {}, this.onCreate_.bind(this));
  }

  httpClient.prototype.onCreate_ = function(CreateInfo) {
    this.sid = CreateInfo.socketId;

    chrome.socket.connect(this.sid, this.host, this.port, this.onConnect_.bind(this));
  }

  httpClient.prototype.onConnect_ = function(res) {

    if(res === 0) {
      this.sendRequest_();
    } else {
      throw("chrome.socket.connect error");
    }
  }

  httpClient.prototype.sendRequest_ = function(){
    var REQ = [
      "GET ${path} HTTP/1.1",
      "Host: ${host}",
      "Connection: close",
      "User-Agent: ${ua}",
      "",
      "",
      ""
    ].join("\r\n");

    var req = REQ.replace("${path}", this.path).replace("${host}", this.host).replace("${ua}", UA);

    chrome.socket.write(this.sid, encodeToBuffer(req), this.recvResponse_.bind(this));
  }

  httpClient.prototype.recvResponse_ = function(writeInfo) {
    if(writeInfo.bytesWritten > 0) {
      var recv_ = "";
      var read_ = function(){
        chrome.socket.read(this.sid, 65535, function(readInfo) {
          recv_ += decodeFromBuffer(readInfo.data);
          if(readInfo.resultCode > 0 ) {
            read_();
          } else {
            var body_ = recv_.split("\r\n\r\n").slice(1).join("\r\n\r\n");
            if(typeof(this.successCallback) === "function") {
              this.successCallback(body_);
            } else {
              console.log("==================================================\n");
              console.log(body_);
              console.log("==================================================\n");
            }
          }
        }.bind(this));
      }.bind(this);

      read_();
    } else {
      throw("sendRequest error");
    }
  }
}());


// test code
// var http = new httpClient({url:"http://komachu.sakura.ne.jp"}, function(recv){
//    console.log("recv!!", recv);
//    });
