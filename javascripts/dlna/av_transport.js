if (!!window.AVTransport === false) {
  var AVTransport = null;
}

(function(global){
  var xmls = {
    "GetMediaInfo": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:GetMediaInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '</u:GetMediaInfo>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),

    "GetPositionInfo": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:GetPositionInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '</u:GetPositionInfo>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),

    "GetTransportInfo": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:GetTransportInfo xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '</u:GetTransportInfo>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),

    "SetAVTransportURI": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '<CurrentURI>${uri}</CurrentURI>',
      '<CurrentURIMetaData></CurrentURIMetaData>',
      '</u:SetAVTransportURI>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),

    "SetNextAVTransportURI": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:SetNextAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '<NextURI>${uri}</NextURI>',
      '<NextURIMetaData></NextURIMetaData>',
      '</u:SetNextAVTransportURI>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),

    "Play": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '<Speed>1</Speed>',
      '</u:Play>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),

    "Pause": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:Pause xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '</u:Pause>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),

    "Stop": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:Stop xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">',
      '<InstanceID>0</InstanceID>',
      '</u:Stop>',
      '</s:Body>',
      '</s:Envelope>'
    ].join("")
  }

  AVTransport = function(url){
    this.url = url;
  }
  AVTransport.prototype.send = function(xml, method, successCallback, errorCallback){
    if(!!this.url === false) {
      throw("AVTransport: url does not set");
    }
    $.ajax({
      type: "POST",
      url: this.url,
      headers: {
        SOAPACTION: "\"urn:schemas-upnp-org:service:AVTransport:1#${method}\"".replace("${method}", method)
      },
      contentType: 'text/xml ; charset="utf-8"',
      data: xml,
      success: function(data){
        var res = data;
        if(typeof(successCallback) === "function"){
          successCallback(res);
        } else {
          console.log(res);
        }
      },
      error: function(e) {
        var res = {
          status: e.status,
          data: e.responseXML
        }
        if(typeof(errorCallback) === "function"){
          errorCallback(res);
        } else {
          throw(res);
        }
      }
    })
  }

  AVTransport.prototype.getMediaInfo = function(callback, errorCallback){
    var method = "GetMediaInfo";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res)
    });
  }

  AVTransport.prototype.getPositionInfo = function(callback, errorCallback){
    var method = "GetPositionInfo";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res)
    });
  }

  AVTransport.prototype.getTransportInfo = function(callback, errorCallback){
    var method = "GetTransportInfo";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res)
    });
  }

  AVTransport.prototype.setAVTransportURI = function(url, callback, errorCallback){
    var method = "SetAVTransportURI";
    this.send(xmls[method].replace("${uri}", url), method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res)
    });
  }

  AVTransport.prototype.setNextAVTransportURI = function(url, callback, errorCallback){
    var method = "SetNextAVTransportURI";
    this.send(xmls[method].replace("${uri}", url), method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }


  AVTransport.prototype.play = function(callback, errorCallback){
    var method = "Play";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }

  AVTransport.prototype.stop = function(callback, errorCallback){
    var method = "Stop";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }

  AVTransport.prototype.pause = function(callback, errorCallback){
    var method = "Pause";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }
}(window));

