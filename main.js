var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , temporal = require('temporal')
  , five = require('johnny-five');

var board = new five.Board();
var digitalPinCount = 14;
var analogPinCount = 6;

// Bluetooth connection
/*var board = new five.Board({
  port: '/dev/tty.ARDUINO-DevB'
});*/


var pins = [];
var analogPins = {};

function initDigitalPins(n) {
  for (var i = 0; i < n; i++) {
    pins.push(new five.Pin(i));
    pins[i].low();
  }
}

function initAnalogPins(n) {
  for (var i = 0; i < n; i++) {
    pins.push(new five.Pin(i+digitalPinCount));
    pins[i+digitalPinCount].mode = five.Pin.ANALOG;
  }
}

board.on('ready', function() {
  initDigitalPins(digitalPinCount);
  initAnalogPins(analogPinCount);
});

io.sockets.on('connection', function (socket) {
  if (board.isReady){

    socket.on('queryMode', function(pin) {
      socket.emit('queriedMode', { pin: pin, mode: pins[pin].mode });
    });

    // DIGITAL PINS
    function setDigitalPinToInput(n) {
      pins[n] = new five.Pin({
        pin: n,
        type: 'digital',
        mode: 0
      });

      pins[n].on('high', function() {
        socket.emit('queriedDigital', { pin: n, value: 1 });
      });

      pins[n].on('low', function() {
        socket.emit('queriedDigital', { pin: n, value: 0 });
      });
    }

    function setDigitalPinToOutput(n) {
      pins[n] = new five.Pin(n);
      pins[n].low();
    }

    socket.on('toggleDigitalMode', function(pin) {
      pins[pin].query(function(state) {
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
      pins[pin].query(function(state) {
        socket.emit('queriedDigital', { pin: pin, value: state.value });
      });
    });

    socket.on('toggleDigitalValue', function(pin) {
      pins[pin].query(function(state) {
        pins[pin][ state.value ? 'low' : 'high' ]();

        socket.emit('toggledDigitalValue', { pin: pin, value: state.value });
      });
    });



    // ANALOG PINS
    socket.on('toggleAnalogMode', function(pin) {
      pins[pin].mode = (pins[pin].mode === five.Pin.ANALOG ? five.Pin.OUTPUT : five.Pin.ANALOG);
      socket.emit('toggledAnalogMode', { pin: pin, mode: pins[pin].mode });
    });


    socket.on('queryAnalog', function(pin) {
      pins[pin].query(function(state) {
        socket.emit('queriedAnalog', { pin: pin, value: state.value });
      });
    });

    socket.on('setAnalogValue', function(data) {
      //pins[data.pin].mode = five.Pin.PWM;
      //pins[data.pin].mode = five.Pin.ANALOG;
      //board.analogWrite(data.pin, data.value);
      //five.Pin.analogWrite(pins[data.pin], data.value);
      pins[data.pin].write(data.value);
    });

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

