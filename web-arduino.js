var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , five = require('johnny-five');

// INITIALIZE BOARD
var board = new five.Board();

// Bluetooth connection
/*var board = new five.Board({
  port: '/dev/tty.ARDUINO-DevB'
});*/


var pins = [];
var digitalPinCount = 14;
var analogPinCount = 6;

function initDigitalPins(n) {
  for (var i = 0; i < n; i++) {
    pins.push(new five.Pin(i));
    pins[i].low();
  }
}

function initAnalogPins(n) {
  for (var i = 0; i < n; i++) {
    pins.push(new five.Pin(i + digitalPinCount));
    pins[i + digitalPinCount].mode = five.Pin.ANALOG;
  }
}

board.on('ready', function() {
  initDigitalPins(digitalPinCount);
  initAnalogPins(analogPinCount);
});


// UI CONNECTION
io.sockets.on('connection', function (socket) {
  if (board.isReady){

    // QUERIES
    function sendState(pin) {
      pins[pin].query(function(state) {
        socket.emit('queriedState', { pin: pin, mode: pins[pin].mode, value: state.value });
      });
    }

    socket.on('queryState', function(pin) {
      sendState(pin);
    });


    // DIGITAL PINS
    function setDigitalPinToInput(pin) {
      pins[pin] = new five.Pin({
        pin: pin,
        type: 'digital',
        mode: 0
      });

      pins[pin].on('high', function() {
        sendState(this.pin);
      });

      pins[pin].on('low', function() {
        sendState(this.pin);
      });
    }

    function setDigitalPinToOutput(pin) {
      pins[pin] = new five.Pin(pin);
    }

    socket.on('toggleDigitalMode', function(pin) {
      //pins[pin].mode = (pins[pin].mode === five.Pin.INPUT ? five.Pin.OUTPUT : five.Pin.INPUT);
      pins[pin].mode === five.Pin.INPUT ? setDigitalPinToOutput(pin) : setDigitalPinToInput(pin);

      sendState(pin);
    });

    socket.on('toggleDigitalValue', function(pin) {
      pins[pin].query(function(state) {
        pins[pin][ state.value ? 'low' : 'high' ]();

        sendState(pin);
      });
    });


    // PWM PINS
    socket.on('togglePWMMode', function(pin) {
      pins[pin].mode = (pins[pin].mode === five.Pin.PWM ? five.Pin.OUTPUT : five.Pin.PWM);

      sendState(pin);
    });

    socket.on('setPWMValue', function(data) {
      board.analogWrite(data.pin, data.value);

      sendState(data.pin);
    });


    // ANALOG PINS
    socket.on('toggleAnalogMode', function(pin) {
      pins[pin].mode = (pins[pin].mode === five.Pin.ANALOG ? five.Pin.OUTPUT : five.Pin.ANALOG);

      sendState(pin);
    });

    
  }
});


// WEB SERVER
var indexFilename = 'index.html';
app.listen(8080);
function handler (req, res) {
  fs.readFile(__dirname + '/' + indexFilename,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + indexFilename);
    }

    res.writeHead(200);
    res.end(data);
  });
}

