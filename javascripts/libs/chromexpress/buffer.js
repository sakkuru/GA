var decodeFromBuffer = function(buf){
  var arr = new Int8Array(buf);
  var str = "";
  for(var i = 0, l = arr.length; i < l; i++) {
    str += String.fromCharCode.call(this, arr[i]);
  }
  return str;
};


// The code below is referred from awesome blog post written in http://qiita.com/items/1626defd020b2157e6bf
var encodeToBuffer = function(str){
  //作業用の領域を確保
  var ab_ = new ArrayBuffer(str.length * 4); // ざっくり固定長で取る（4倍とっておけば safe
  var bytes_ = new Uint8Array(ab_); // TypedArrayでviewを与える

  var n = str.length,
      idx = -1,
      i, c;

  for(i = 0; i < n; ++i){
    c = str.charCodeAt(i);
    if(c <= 0x7F){
      bytes_[++idx] = c;
    } else if(c <= 0x7FF){
      bytes_[++idx] = 0xC0 | (c >>> 6);
      bytes_[++idx] = 0x80 | (c & 0x3F);
    } else if(c <= 0xFFFF){
      bytes_[++idx] = 0xE0 | (c >>> 12);
      bytes_[++idx] = 0x80 | ((c >>> 6) & 0x3F);
      bytes_[++idx] = 0x80 | (c & 0x3F);
    } else {
      bytes_[++idx] = 0xF0 | (c >>> 18);
      bytes_[++idx] = 0x80 | ((c >>> 12) & 0x3F);
      bytes_[++idx] = 0x80 | ((c >>> 6) & 0x3F);
      bytes_[++idx] = 0x80 | (c & 0x3F);
    }
  }
  var ret = ab_.slice(0, idx+1);
  return ret;
}
