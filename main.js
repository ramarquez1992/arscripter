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

    function sendState(pin) {
      pins[pin].query(function(state) {
        socket.emit('queriedState', { pin: pin, mode: pins[pin].mode, value: state.value });
      });
    }

    socket.on('queryState', function(pin) {
      sendState(pin);
    });

    /*
    for (var i = 0; i < digitalPinCount; i++) {
      pins[i].on('high', function() {
        console.log('went high');
        sendState(this.pin);
      });

      pins[i].on('low', function() {
        console.log('went low');
        sendState(this.pin);
      });
    }
    */

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
      //board.pinMode(pin, pins[pin].mode === five.Pin.INPUT ? five.Pin.OUTPUT : five.Pin.INPUT);
      pins[pin].mode === five.Pin.INPUT ? setDigitalPinToOutput(pin) : setDigitalPinToInput(pin);

      sendState(pin);
    });

    socket.on('toggleDigitalValue', function(pin) {
      pins[pin].query(function(state) {
        pins[pin][ state.value ? 'low' : 'high' ]();
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
    // TODO: automatically send analog data when changed
    // TODO: remove analog set value to digital toggle
    socket.on('toggleAnalogMode', function(pin) {
      pins[pin].mode = (pins[pin].mode === five.Pin.ANALOG ? five.Pin.OUTPUT : five.Pin.ANALOG);

      sendState(pin);
    });

    socket.on('setAnalogValue', function(data) {
      pins[data.pin].write(data.value);

      sendState(data.pin);
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

