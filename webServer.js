var fs = require('fs');

var indexFilename = '/build/index.html';
var port = 8080;

var app = require('http').createServer(handler);
app.listen(port);

function handler (req, res) {
  if (req.url === '/') req.url = indexFilename;
  req.url = __dirname + req.url;

  fs.readFile(req.url, function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + req.url);
    }

    res.writeHead(200);
    res.end(data);
  });
}

module.exports.app = app;
module.exports.io = require('socket.io').listen(app);

