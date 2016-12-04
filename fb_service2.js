const util = require('util');
var express       = require('express'),
    FB            = require('fb'),
    http          = require('http'),
    path          = require('path'),

    config        = require('./config');

var app = express();
var request = require('request');


if(!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}


app.set('port', process.env.PORT || 8888);

10208416077099047

app.get('/', function (req, res) {
  console.log("Got a GET request for the homepage");
  FB.api("/10208416077099047/tags", {
    access_token:req.query.token,
    limit:100
  }, function(response2) {
    console.log("response2",response2);
  });
  res.send("hola");
});

var server = app.listen(8888, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
