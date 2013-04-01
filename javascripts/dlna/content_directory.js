if (!!window.ContentDirectory === false) {
  var ContentDirectory = null;
}

(function(global){
  var xmls = {
    "Browse": [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
      '<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">',
      '<ObjectID>${oid}</ObjectID>',
      '<BrowseFlag>BrowseDirectChildren</BrowseFlag>',
      '<Filter>*</Filter>',
      '<StartingIndex>0</StartingIndex>',
      '<RequestedCount>100000</RequestedCount>',
      '<SortCriteria></SortCriteria>',
      '</u:Browse>',
      '</s:Body>',
      '</s:Envelope>'
    ].join("")
  }

  ContentDirectory = function(url){
    this.url = url;
  }
  ContentDirectory.prototype.send = function(xml, method, successCallback, errorCallback){
    if(!!this.url === false) {
      throw("ContentDirectory: url does not set");
    }
    $.ajax({
      type: "POST",
      url: this.url,
      headers: {
        SOAPACTION: "\"urn:schemas-upnp-org:service:ContentDirectory:1#${method}\"".replace("${method}", method)
      },
      contentType: 'text/xml ; charset="utf-8"',
      data: xml,
      success: function(data){
        console.dir(data);
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

  ContentDirectory.prototype.browse = function(oid, callback, errorCallback){
    var method = "Browse";
    this.send(xmls[method].replace('${oid}', oid), method, function(res) {
      callback(res);
    }, function(res){
      errorCallback(res);
    });
  }

}(window));

