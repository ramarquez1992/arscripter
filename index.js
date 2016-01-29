var path = require('path'),
  argv = require('minimist')(process.argv.slice(2)),
  five = require('johnny-five'),
  webServer = require('./js/webServer.js'),
  socket = null,
  boardTypes = require('./boardTypes.json'),
  errors = require('./errors.json');


// PARSE ARGUMENTS
var boardPath = null;
if (argv.hasOwnProperty('b')) {
  boardPath = argv.b;
}

var serverPort = 8080;
// TODO: dynamically set socket in main.js to connect to this user-defined port
/*if (argv.hasOwnProperty('p')) {
  serverPort = argv.p;
}*/

if (argv.hasOwnProperty('h')) {
  console.log('USAGE: node ' + path.basename(process.argv[1]) + ' [-b <PATH_TO_BOARD>]');
  process.exit(1);
}


// SERVER INITIALIZATION
webServer.start(serverPort);


// BOARD INITIALIZATION
var board = new five.Board({
  port: boardPath,
  repl: false,
  debug: false,
});

board.on('error', function(err) {
  if (err.hasOwnProperty('message')) {
    console.log('\nERROR: ' + err.message);
  }
});

board.on('ready', function() {
  var t = getBoardType(this);

  if (t === null) {
    console.log(errors.UNSUPPORTED_BOARD);
    process.exit(1);
  }

  initBoard(t);

  console.log('Board ready! Navigate to http://localhost:' + serverPort + '  (^C to exit)');
});

function getBoardType(b) {
  var t = null;

  // Search for correct board type by number of pins
  for (var possibleTypeKey in boardTypes) {
    var totalPins = boardTypes[possibleTypeKey].digitalPins.length + boardTypes[possibleTypeKey].analogPins.length;

    if (b.pins.length === totalPins) {
      t = boardTypes[possibleTypeKey];
      break;
    }
  }

  return t;
}

function initBoard(boardType) {
  initDigitalPins(boardType.digitalPins);
  initAnalogPins(boardType.analogPins);
}

function initDigitalPins(digitalPins) {
  for (var i = 0; i < digitalPins.length; i++) {
    setPinMode({ pin: digitalPins[i], mode: 'output' });
  }
}

function initAnalogPins(analogPins) {
  for (var i = 0; i < analogPins.length; i++) {
    setPinMode({ pin: analogPins[i], mode: 'analog' });
  }
}


// MODE SETTERS
function setPinMode(data) {
  if (data.mode === 'input') {
    setPinToDigitalInput(data.pin);
  } else if (data.mode === 'output') {
    setPinToDigitalOutput(data.pin);
  } else if (data.mode === 'analog') {
    setPinToAnalog(data.pin);
  } else if (data.mode === 'pwm') {
    setPinToPWM(data.pin);
  } else {
    sendError(errors.UNSUPPORTED_MODE);
  }

  sendPinState(data.pin);
}

function setPinToDigitalInput(pin) {
  board.pinMode(pin, five.Pin.INPUT);
  board.digitalRead(pin, function(value) {
    sendPinState(pin);
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


// VALUE SETTERS
function setPinValue(data) {
  if (board.pins[data.pin].mode === five.Pin.PWM) {
    setPWMValue(data.pin, data.value);
  } else {
    setDigitalValue(data.pin, data.value);
  }

  sendPinState(data.pin);
}

function setDigitalValue(pin, value) {
  board.digitalWrite(pin, value);
}

function setPWMValue(pin, value) {
  board.analogWrite(pin, value);
}


/* ----------- DEPRECATED ----------- */
function toggleDigitalMode(pin) {
  if (board.pins[pin].mode === five.Pin.INPUT) {
    setPinToDigitalOutput(pin);
  } else {
    setPinToDigitalInput(pin);
  }

  sendPinState(pin);
}

function toggleDigitalValue(pin) {
  var newValue = 0;

  if (board.pins[pin].value === 0) {
    newValue = 1;
  }

  board.digitalWrite(pin, newValue);
  sendPinState(pin);
}

function togglePWMMode(pin) {
  if (board.pins[pin].mode === five.Pin.PWM) {
    setPinToDigitalInput(pin);
  } else if (board.pins[pin].mode === five.Pin.INPUT) {
    setPinToDigitalOutput(pin);
  } else {
    setPinToPWM(pin);
  }

  sendPinState(pin);
}

function toggleAnalogMode(pin) {
  if (board.pins[pin].mode === five.Pin.ANALOG) {
    setPinToDigitalOutput(pin);
  } else {
    setPinToAnalog(pin);
  }

  sendPinState(pin);
}

/* ----------- END DEPRECATED ----------- */


// QUERIES
function sendBoardType() {
  if (socket !== null)
    socket.emit('setBoard', getBoardType(board));
}

function sendPinState(pin) {
  if (socket !== null)
    socket.emit('setPinState', { pin: pin, mode: board.pins[pin].mode, value: board.pins[pin].value });
}

function sendError(err) {
  if (socket !== null)
    socket.emit('errorMet', err);
}


// SOCKET CONTROLLER
webServer.io.sockets.on('connection', function (s) {
  socket = s; // Add socket to global scope

  if (board.isReady){
    sendBoardType();

    socket.on('getBoardType', sendBoardType);
    socket.on('getPinState', sendPinState);

    socket.on('setPinMode', setPinMode);
    socket.on('setPinValue', setPinValue);

    /* ----------- DEPRECATED ----------- */
    socket.on('toggleDigitalMode', toggleDigitalMode);
    socket.on('toggleAnalogMode', toggleAnalogMode);
    socket.on('togglePWMMode', togglePWMMode);

    socket.on('toggleDigitalValue', toggleDigitalValue);
    socket.on('setPWMValue', setPWMValue);
    /* ----------- END DEPRECATED ----------- */

  }
});

