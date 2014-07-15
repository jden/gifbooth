var http = require('http');
var express = require('express');
var sio = require('socket.io');
var uuid = require('uuid');

var rate = require('express-rate');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var path = require('path');
var fs = require('fs');
var del = require('del');

var vidPath = path.join(__dirname, '../dist/video');
var app = express();
var server = http.Server(app);
var io = sio(server);

var simpleMiddleware = rate.middleware({interval: 6, limit: 3});

app.use(express.static(path.join(__dirname, '../dist')));
app.use(bodyParser());
app.use(methodOverride());

var maxVideos = 10;
var counter = 0;

del.sync(vidPath+'/*');

app.post('/upload', simpleMiddleware, function(req, res, next){
  var id = ++counter;
  /*
  if (id === maxVideos) {
    counter = 0;
  }
  */
  var outPath = path.join(vidPath, id+'.webm');
  req.pipe(fs.createWriteStream(outPath)).once('finish', function(){
    io.emit('video', id);
    res.status(200);
    res.end();
  });
});

io.on('connection', function(socket){
  fs.readdir(vidPath, function(err, files){
    files.sort().slice(0, maxVideos).forEach(function(file){
      socket.emit('video', path.basename(file, path.extname(file)));
    });
  });
});

module.exports = server;