if (!!window.RenderingControl === false) {
  var RenderingControl = null;
}

(function(global){
  var xmls = {
    "GetMute": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:GetMute xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">',
      '<InstanceID>0</InstanceID>',
      '<Channel>Master</Channel>',
      '</u:GetMute>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),
    "GetVolume": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:GetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">',
      '<InstanceID>0</InstanceID>',
      '<Channel>Master</Channel>',
      '</u:GetVolume>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),
    "SetMute": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:SetMute xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">',
      '<InstanceID>0</InstanceID>',
      '<Channel>Master</Channel>',
      '<DesiredMute>${mute}</DesiredMute>', // ${mute} = 0: Mute off, 1: Mute on
      '</u:SetMute>',
      '</s:Body>',
      '</s:Envelope>'
    ].join(""),
    "SetVolume": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:SetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">',
      '<InstanceID>0</InstanceID>',
      '<Channel>Master</Channel>',
      '<DesiredVolume>${volume}</DesiredVolume>', // ${volume} = from 0 to 100
      '</u:SetVolume>',
      '</s:Body>',
      '</s:Envelope>'
    ].join("")
  }

  RenderingControl = function(url){
    this.url = url;
  }
  RenderingControl.prototype.send = function(xml, method, successCallback, errorCallback){
    if(!!this.url === false) {
      throw("RenderingControl: url does not set");
    }
    $.ajax({
      type: "POST",
      url: this.url,
      headers: {
        SOAPACTION: "\"urn:schemas-upnp-org:service:RenderingControl:1#${method}\"".replace("${method}", method)
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

  RenderingControl.prototype.getMute = function(callback, errorCallback){
    var method = "GetMute";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }

  RenderingControl.prototype.getVolume = function(callback, errorCallback){
    var method = "GetVolume";
    this.send(xmls[method], method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }

  RenderingControl.prototype.setMute = function(mute /* "on" or "off" */, callback, errorCallback){
    var method = "SetMute";
    var mute_ = mute === "on" ? 1 : 0;
    this.send(xmls[method].replace("${mute}", mute_), method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }

  RenderingControl.prototype.setVolume = function(volume /* from 0 to 100 */, callback, errorCallback){
    var method = "SetVolume";
    this.send(xmls[method].replace("${volume}", volume), method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }
}(window));

