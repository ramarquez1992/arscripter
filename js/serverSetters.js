function resetBoard() {
  stopScript();
  resetAnalogCharts();

  socket.emit('resetBoard', boardType);
}

function setPinMode(pin, mode) {
  socket.emit('setPinMode', { pin: pin, mode: mode });
}

function setPinValue(pin, value) {
  socket.emit('setPinValue', { pin: pin, value: value });
}

function togglePinMode(pin) {
  if (isAnalogPin(pin)) {
    toggleAnalogMode(pin);
  } else if (isPWMPin(pin)) {
    togglePWMMode(pin);
  } else {
    toggleDigitalMode(pin);
  }
}

function toggleDigitalMode(pin) {
  var currentMode = findPinMode(pin);
  var newMode;
  
  if (currentMode === pinModes.INPUT) {
    newMode = pinModes.OUTPUT;
  } else {
    newMode = pinModes.INPUT;
  }

  setPinMode(pin, newMode);
}

function toggleAnalogMode(pin) {
  var currentMode = findPinMode(pin);
  var newMode;
  
  if (currentMode === pinModes.ANALOG) {
    newMode = pinModes.OUTPUT;
  } else {
    newMode = pinModes.ANALOG;
  }

  setPinMode(pin, newMode);
}

function togglePWMMode(pin) {
  var currentMode = findPinMode(pin);
  var newMode;
  
  if (currentMode === pinModes.PWM) {
    newMode = pinModes.INPUT;
  } else if (currentMode === pinModes.INPUT) {
    newMode = pinModes.OUTPUT;
  } else {
    newMode = pinModes.PWM;
  }

  setPinMode(pin, newMode);
}

function toggleDigitalValue(pin) {
  var currentValue = findPinValue(pin);
  var newValue;
  
  if (currentValue === 0) {
    newValue = 1;
  } else {
    newValue = 0;
  }

  setPinValue(pin, newValue);
}

function setPWMValue(pin) {
  var newValue = findPWMSliderValue(pin);
  setPinValue(pin, newValue);
}


// ANALOG POLLS
var pinPolls = {};

function setPoll(pin, interval) {
  stopPoll(pin);

  pinPolls[pin] = window.setInterval(function() {
    socket.emit('getPinState', pin);
  }, interval);
}

function stopPoll(pin) {
  if (pinPolls[pin] !== null) {
    window.clearInterval(pinPolls[pin]);
  }
}

