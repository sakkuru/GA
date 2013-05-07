var user_id = user_id || '';

$(function(){

  chrome.storage.local.get('user_id',  function(items){

    if($.isEmptyObject(items)){

      user_id = create_privateid(20);
      console.log(user_id)
      chrome.storage.local.set({'user_id': user_id}, function() {
      });

      chrome.storage.local.get('user_id',  function(items){
        console.log(items);
      })

    }else{
      console.log(items);
    }

    user_id = items['user_id'];
    _gaq.push(['_trackPageview', user_id]);

  })



});


var clear_id = function(){
    chrome.storage.local.remove('user_id', function(){
    });
}

function create_privateid( n ){
    var CODE_TABLE = "0123456789"
        + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        + "abcdefghijklmnopqrstuvwxyz";
    var r = "";
    for (var i = 0, k = CODE_TABLE.length; i < n; i++)
        r += CODE_TABLE.charAt(Math.floor(k * Math.random()));
    return r;
}