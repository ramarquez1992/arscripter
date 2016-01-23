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

io.sockets.on('connection', function (socket) {
  if (board.isReady){

    function setDigitalPinToInput(n) {
      digitalPins[n] = new five.Pin({
        pin: n,
        type: 'digital',
        mode: 0
      });

      digitalPins[n].on('high', function() {
        socket.emit('queriedDigital', { pin: n, value: 1 });
      });

      digitalPins[n].on('low', function() {
        socket.emit('queriedDigital', { pin: n, value: 0 });
      });
    }

    function setDigitalPinToOutput(n) {
      digitalPins[n] = new five.Pin(n);
      digitalPins[n].low();
    }

    socket.on('toggleDigitalMode', function(pin) {
      digitalPins[pin].query(function(state) {
        var newMode;

        if (state.mode === 0) {
          setDigitalPinToOutput(pin);
          newMode = 1
        } else {
          setDigitalPinToInput(pin);
          newMode = 0;
        }

        socket.emit('toggledDigitalMode', { pin: pin, mode: newMode });
      });
    });

    socket.on('queryDigital', function(pin) {
      digitalPins[pin].query(function(state) {
        socket.emit('queriedDigital', { pin: pin, value: state.value });
      });
    });

    socket.on('toggleDigitalValue', function(pin) {
      digitalPins[pin].query(function(state) {
        digitalPins[pin][ state.value ? 'low' : 'high' ]();

        socket.emit('toggledDigitalValue', { pin: pin, value: state.value });
      });
    });

    /*
    // read in light data, pass to browser
    light.on('data',function(){
      socket.emit('light', { raw: this.raw });
    });
    */

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

