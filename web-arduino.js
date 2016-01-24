var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  five = require('johnny-five');

var socket = {};

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

function initPins() {
  initDigitalPins(digitalPinCount);
  initAnalogPins(analogPinCount);
}

board.on('ready', function() {
  initPins();
});


// QUERIES
function sendState(pin) {
  pins[pin].query(function(state) {
    socket.emit('queriedState', { pin: pin, mode: pins[pin].mode, value: state.value });
  });
}

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

function toggleDigitalMode(pin) {
  if (pins[pin].mode === five.Pin.INPUT) {
    setDigitalPinToOutput(pin);
  } else {
    setDigitalPinToInput(pin);
  }

  sendState(pin);
}

function toggleDigitalValue(pin) {
  pins[pin].query(function(state) {
    pins[pin][ state.value ? 'low' : 'high' ]();

    sendState(pin);
  });
}

// PWM PINS
function togglePWMMode(pin) {
  if (pins[pin].mode === five.Pin.PWM) {
    pins[pin].mode = five.Pin.OUTPUT;
  } else {
    pins[pin].mode = five.Pin.PWM;
  }

  sendState(pin);
}

function setPWMValue(data) {
  board.analogWrite(data.pin, data.value);

  sendState(data.pin);
}

// ANALOG PINS
function toggleAnalogMode(pin) {
  if (pins[pin].mode === five.Pin.ANALOG) {
    pins[pin].mode = five.Pin.OUTPUT;
  } else {
    pins[pin].mode = five.Pin.ANALOG;
  }

  sendState(pin);
}

// SOCKET CONTROLLER
io.sockets.on('connection', function (s) {
  socket = s;

  if (board.isReady){

    // QUERIES
    socket.on('queryState', sendState);


    // DIGITAL PINS
    socket.on('toggleDigitalMode', toggleDigitalMode);
    socket.on('toggleDigitalValue', toggleDigitalValue);


    // PWM PINS
    socket.on('togglePWMMode', togglePWMMode);
    socket.on('setPWMValue', setPWMValue);


    // ANALOG PINS
    socket.on('toggleAnalogMode', toggleAnalogMode);

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

