var http = require("http");
var https = require("https");

exports.get = function(url, callback) {
    console.log(url.indexOf("https"));
    if(url.indexOf("https") == 0) {
        https.get(url, callback);
    } else {
        http.get(url, callback);
    }
};