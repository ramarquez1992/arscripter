var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  five = require('johnny-five'),
  boardTypes = require('./boardTypes.json'),
  errors = require('./errors.json');

var socket = {};


// INITIALIZE BOARD
var board = new five.Board();

// Bluetooth connection
/*var board = new five.Board({
  port: '/dev/tty.ARDUINO-DevB'
});*/

function initDigitalPins(digitalPins) {
  for (var i = 0; i < digitalPins.length; i++) {
    setPinToDigitalOutput(digitalPins[i]);
  }
}

function initAnalogPins(analogPins) {
  for (var i = 0; i < analogPins.length; i++) {
    setPinToAnalog(analogPins[i]);
  }
}

function initBoard(boardType) {
  initDigitalPins(boardType.digitalPins);
  initAnalogPins(boardType.analogPins);
}

function getBoardType(b) {
  var t = null;

  for (var possibleTypeKey in boardTypes) {
    var totalPins = boardTypes[possibleTypeKey].digitalPins.length + boardTypes[possibleTypeKey].analogPins.length;

    if (board.pins.length === totalPins) {
      t = boardTypes[possibleTypeKey];
      break;
    }
  }

  return t;
}


// QUERIES
function sendState(pin) {
  socket.emit('queriedState', { pin: pin, mode: board.pins[pin].mode, value: board.pins[pin].value });
}

// err: { code:int, msg:string }
function sendError(err) {
  socket.emit('errorMet', err);
}


// DIGITAL PINS
function setPinToDigitalInput(pin) {
  board.pinMode(pin, five.Pin.INPUT);
  board.digitalRead(pin, function(value) {
    sendState(pin);
  });
}

function setPinToDigitalOutput(pin) {
  board.pinMode(pin, five.Pin.OUTPUT);
  board.digitalWrite(pin, 0);
}

function setPinToAnalog(pin) {
  board.pinMode(pin, five.Pin.ANALOG);
}

function setPinToPWM(pin) {
  board.pinMode(pin, five.Pin.PWM);
  board.analogWrite(pin, 0);
}

function toggleDigitalMode(pin) {
  if (board.pins[pin].mode === five.Pin.INPUT) {
    setPinToDigitalOutput(pin);
  } else {
    setPinToDigitalInput(pin);
  }

  sendState(pin);
}

function toggleDigitalValue(pin) {
  var newValue = 0;

  if (board.pins[pin].value === 0) {
    newValue = 1;
  }

  board.digitalWrite(pin, newValue);
  sendState(pin);
}


// PWM PINS
function togglePWMMode(pin) {
  if (board.pins[pin].mode === five.Pin.PWM) {
    setPinToDigitalInput(pin);
  } else if (board.pins[pin].mode === five.Pin.INPUT) {
    setPinToDigitalOutput(pin);
  } else {
    setPinToPWM(pin);
  }

  sendState(pin);
}

function setPWMValue(data) {
  board.analogWrite(data.pin, data.value);

  sendState(data.pin);
}


// ANALOG PINS
function toggleAnalogMode(pin) {
  if (board.pins[pin].mode === five.Pin.ANALOG) {
    setPinToDigitalOutput(pin);
  } else {
    setPinToAnalog(pin);
  }

  sendState(pin);
}

board.on('ready', function() {
  var t = getBoardType(this);

  if (t === null) {
    console.log(errors.UNSUPPORTED_BOARD);
    process.exit(1);
  }

  initBoard(t);
});

function sendBoardType() {
  socket.emit('setBoard', getBoardType(board));
}

// SOCKET CONTROLLER
io.sockets.on('connection', function (s) {
  socket = s;

  if (board.isReady){
    sendBoardType();

    socket.on('initBoard', initBoard);
    socket.on('getBoardType', sendBoardType);

    socket.on('queryState', sendState);

    socket.on('toggleDigitalMode', toggleDigitalMode);
    socket.on('toggleAnalogMode', toggleAnalogMode);
    socket.on('togglePWMMode', togglePWMMode);

    socket.on('toggleDigitalValue', toggleDigitalValue);
    socket.on('setPWMValue', setPWMValue);

  }
});


// WEB SERVER
var indexFilename = 'build/index.html';

app.listen(8080);
function handler (req, res) {
  if (req.url === '/') req.url += indexFilename;

  fs.readFile(__dirname + req.url,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + indexFilename);
    }

    res.writeHead(200);
    res.end(data);
  });
}

