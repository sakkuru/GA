var UPnP;

(function(){
  /**
   * utilities
   *
   */
  var socket = chrome.experimental.socket || chrome.socket;

  // translate text string to Arrayed buffer
  //
  function t2ab(str /* String */) {
    return encodeToBuffer(str);
  }

  // translate Arrayed buffer to text string
  //
  function ab2t(buffer /* ArrayBuffer */) {
    return decodeFromBuffer(buffer);
  }


  /**
   * You can find API documentaion for raw socket api in
   * http://code.google.com/chrome/extensions/trunk/experimental.socket.html
   *
   */

  // SSDP definitions
  var M_SEARCH_REQUEST = "M-SEARCH * HTTP/1.1\r\n" +
    "MX: 3\r\n" +
    "HOST: 239.255.255.250:1900\r\n" +
    "MAN: \"ssdp:discover\"\r\n" +
    "ST: {{st}}\r\n\r\n"

  // UPnP classes
  UPnP = function(target){
    this.sid = null;
    this.MIP_ = "239.255.255.250";
    this.PORT_ = 1900;

    this.destaddr = !!target === false ? this.MIP_ : target;

    var self = this;
    socket.create('udp', {}, function(socketInfo) {
      self.sid = socketInfo.socketId;
      socket.bind(self.sid, "0.0.0.0", 0, function(res) {
        if(res !== 0) {
          throw('cannot bind socket');
        }
        self.onready();
      });
    });
  }

  // interface to onready
  UPnP.prototype.onready = function() {
  }

  // do M-SEARCH
  UPnP.prototype.search = function(st /* search type */, callback /* function */ ) {
    if(!!this.sid === false) {
      throw('socket id is not allocated');
    }

    var ssdp = M_SEARCH_REQUEST.replace("{{st}}", st);
    var buffer = t2ab(ssdp);

    var closure_ = function(e){
      if(e.bytesWritten < 0) {
        console.dir(e);
        throw("an Error occured while sending M-SEARCH : "+e.bytesWritten);
      }

      if(typeof(callback) === "function")
        callback();
    }

    // send M-SEARCH 4 times
    var self = this;
    var send_ = function(){
      socket.sendTo(self.sid, buffer, self.destaddr, self.PORT_, function(e) {
        closure_(e);
      });
    }

    send_();
    setTimeout(send_, 100);
    setTimeout(send_, 200);
    setTimeout(send_, 300);
  }

  // listen response to M-SEARCH
  UPnP.prototype.listen = function(callback) {
    if(!!this.sid === false) {
      throw('socket id is not allocated');
    }

    var self = this;
    var closure_ = function(recv){
      recv.data = ab2t(recv.data);
      if(typeof(callback) === "function") {
        callback(recv);
      }
      self.listen(callback);
    }

    socket.recvFrom(this.sid, function(recv) {
      closure_(recv);
    });
  }
  // destroy socket
  UPnP.prototype.destroy = function() {
    socket.destroy(this.sid);
    this.sid = null;
  }
}());
