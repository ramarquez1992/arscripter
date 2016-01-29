var http = require('http'),
    io = require('socket.io'),
    fs = require('fs');

var indexFilename = '/build/index.html';

var app = http.createServer(function(req, res) {
  if (req.url === '/') req.url = indexFilename;

  // Go to root dir before appending requested filename
  req.url = __dirname + '/..' + req.url;

  fs.readFile(req.url, function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + req.url);
    }

    res.writeHead(200);
    res.end(data);
  });
});

module.exports.start = function(port) {
  app.listen(port);
};

module.exports.io = io.listen(app);

