var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , five = require('johnny-five');

var board = new five.Board();

// Bluetooth connection
/*var board = new five.Board({
  port: '/dev/tty.ARDUINO-DevB'
});*/


var digitalPins = [];

function initDigitalPins(n) {
  for (var i = 0; i < n; i++) {
    digitalPins.push(new five.Pin(i));
    digitalPins[i].low();
  }
}

board.on('ready', function() {
  initDigitalPins(14);
});


// on a socket connection
io.sockets.on('connection', function (socket) {
 
  if (board.isReady){

    socket.on('toggleDigital', function(pin) {
      console.log('Toggling pin ' + pin);
      
      digitalPins[pin].query(function(state) {
        digitalPins[pin][ state.value ? 'low' : 'high' ]();

        socket.emit('toggledDigital', { pin: pin, state: state.value });
      });
    });


    /*
    // read in light data, pass to browser
    light.on('data',function(){
      socket.emit('light', { raw: this.raw });
    });
    */

  } else {
    socket.emit('error', 'Board not ready yet');
  }

});



// handle web server
app.listen(8080);
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

