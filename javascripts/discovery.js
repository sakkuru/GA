var Discovery;

(function(){
  Array.prototype.has = function(str) {
    for(var i = 0, l = this.length; i < l; i++) {
      if(this[i] === str) return true;
    }
    return false;
  }

  // check same Location is already included in the object.
  function check_overlapped(o, list){
    for(i=0; i<list.length; i++){
      if (o.location == list[i].location){
        return true;
      }
    }
    return false;
  }

  // generate object literal from SSDP message.
  var parse = function(data, address) {
    var arr = data.replace(/\r\n|\r/g, "\n").split("\n"), ret = {};

    for(var i = 0, l = arr.length; i < l; i++ ) {
      var a = arr[i].split(":");
      var k = a[0].toLowerCase();
      var v = a.slice(1).join(":").replace(/^\s*/, "");

      if(k === "location")
        v = v.replace("::1%1", address)

      if(!!v) {
        ret[k] = v;
      }
    }
    return ret;
  }




  Discovery = function(){
    this.lists = [];
    this.serviceTypes = [
      "urn:schemas-upnp-org:service:AVTransport:1",
      "urn:schemas-upnp-org:service:RenderingControl:1",
      "urn:schemas-upnp-org:service:ContentDirectory:1"
    ];
    this.results = [];
    this.INTERVAL = 3500;
  }

  Discovery.prototype.parse_ = function(recv, callback, cancel_flag){
    var o = parse(recv.data, recv.address)
      , origin = o.location.split("/").slice(0,3).join("/");
    if(!!cancel_flag) {
      callback(o);
    }

    if(check_overlapped(o,this.lists)) return;

    this.lists.push(o);

    var self = this;
    $.ajax({
      method: "GET",
      url: o.location,
      dataType: "text", // automatically parse xml makes error when device is xbox360 (because of invalid description xml)
      success: function(xmltext){
        var domParser = new DOMParser();
        var data = domParser.parseFromString(xmltext.replace(/="\s+/g, '="'), "application/xml");

        var friendly_name = $(data).find("device > friendlyName").text();
        var icon_url = origin + $(data).find("device > iconList > icon").eq(0).find("url").text();
        var service_type = $(data).find("service > serviceType")
        var services = $(data).find("serviceList > service")
        var control_urls = {}, scpd_urls = {}, service_types = [];


        services.each(function(e){
          var type =  $(this).find("serviceType").text()
          var control_url = $(this).find("controlURL").text()
          var scpd_url = $(this).find("SCPDURL").text()

          control_url = control_url.indexOf("http") === 0 ? control_url : origin + control_url;
          scpd_url = scpd_url.indexOf("http") === 0 ? scpd_url : origin + scpd_url;
          control_urls[type] = control_url;
          scpd_urls[type] = scpd_url;

          service_types.push(type);
        })

        var ret = {
          "descriptionUrl": o.location,
          "friendlyName" : friendly_name,
          "iconUrl" : icon_url,
          "serviceType" : service_types,
          "scpdUrls" : scpd_urls,
          "controlUrls" : control_urls
        }
        self.results.push(ret);
      },
      error: function(xhr, errorstatus, errThrown){
        console.log("An error happens while retrieving description.xml");
        console.dir(xhr);
        console.dir(errorstatus);
        console.dir(errThrown);
      }
    });
  };

  /**
   * Start discoverying UPnP devices
   *
   * @param {function} callback
   *   (optional) callback function for result(discoverd device)
   *    default action is displaying discovered devices in pretty print manner in console.log.
   * @param {string} st
   *   (optional) search target
   *    default is "ssdp:all"
   * @param {boolean} flag
   *   (optional) if this is true, doesn't parse ssdp result and return raw data.
   *    default is false
   * @param {string} target
   *   (optional) destination address, you can specify device's address altanative to multicast address
   *    default is '239.255.255.250' (specified in UPnP module)
   */
  Discovery.prototype.start = function(
      callback,
      st,
      flag,
      target){
    var upnp = new UPnP(target);
    var self = this;

    // initialize discovered result
    this.lists.length = 0;
    this.results.length = 0;

    // check parameter and set default value if unavailable
    st = !!st === false ? "ssdp:all" : st;
    callback = !!callback === false ? function(o) { console.log(JSON.stringify(o, null, "  ")); } : callback;

    // after UDP socket has created below callback will be invoked.
    upnp.onready = function(){
      this.listen(function(recv){
        self.parse_(recv, callback, flag);
      });
      this.search(st);
    }
    setTimeout(function(){
      callback(self.results);
    }, self.INTERVAL);
  };
}())
