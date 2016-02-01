// IMPORT JSON
var errors;
$.ajax({
  dataType: 'json',
  url: '../json/errors.json',
  async: false,
  success: function(data) {
    errors = data;
  }
});

var boardTypes;
$.ajax({
  dataType: 'json',
  url: '../json/boardTypes.json',
  async: false,
  success: function(data) {
    boardTypes = data;
  }
});

var pinModes;
$.ajax({
  dataType: 'json',
  url: '../json/pinModes.json',
  async: false,
  success: function(data) {
    pinModes = data;
  }
});


// INIT
var socket = io.connect('http://localhost:8080');
//var boardType = boardTypes.uno;
var boardType = null;

$(document).ready(function() {
  initPinButtons();
  initScriptButtons();
  initSocket();
  initEditor();
});

function initPinButtons() {
  // Remove all previous handlers to avoid duplicates
  $('.button').off('click');
  $('.button').off('input');


  $('#resetBoardButton').on('click', resetBoard);

  $('.modeToggleButton').on('click', function() {
    togglePinMode(findPinNum($(this)));
  });

  $('.valueToggleButton').on('click', function() {
    toggleDigitalValue(findPinNum($(this)));
  });

  $('.pwmSlider').on('input', function() {
    setPWMValue(findPinNum($(this)));
  });

  $('.stopPollButton').on('click', function() {
    stopPoll(findPinNum($(this)));
  });

  $('.setPollButton').on('click', function() {
    setPoll(findPinNum($(this)));
  });
}

function initSocket() {
  socket.on('setBoard', setBoard);
  socket.on('setPinState', setPinState);
  socket.on('errorMet', logError);
}


// ANGULAR
var app = angular.module('mainApp', ['ngRoute']);
app.controller('mainController', function($scope) {
  // Expose to $scope
  $scope.boardType = boardType;
  $scope.isPWMPin = isPWMPin;

});


// ERRORS
function logError(err) {
    alert('ERROR: ' + err);
}


// CLIENT-SIDE GETTERS
function isDigitalPin(pin) {
  var result = false;

  if ( ($.inArray(pin, boardType.digitalPins) > -1) &&  ($.inArray(pin, boardType.pwmPins) < -1) ) {
    result = true;
  }

  return result;
}

function isAnalogPin(pin) {
  return ($.inArray(pin, boardType.analogPins) > -1 ? true : false);
}

function isPWMPin(pin) {
  return ($.inArray(pin, boardType.pwmPins) > -1 ? true : false);
}

// Find the number of the pin an element belongs to
function findPinNum(el) {
  while (!el.hasClass('pin')) {
    el = el.parent();
  }

  return Number(el.find('meta[name="pinNum"]').first().attr('content'));
}

// Find the element of a given pin
function findByPinNum(n) {
  var el = {};

  $('.pin').each(function() {
    var pinNum = Number($(this).find('meta[name="pinNum"]').first().attr('content'));

    if (n === pinNum) {
      el = $(this);
      return;
    }
  });

  return el;
}

function findPinMode(pin) {
  var el = findByPinNum(pin);
  var modeText = el.find('.modeToggleButton').first().text();
  var currentMode = null;

  // Translate text to const pin mode value
  switch (modeText) {
    case 'in':
      currentMode = pinModes.INPUT;
      break;
    case 'out':
      currentMode = pinModes.OUTPUT;
      break;
    case 'analog':
      currentMode = pinModes.ANALOG;
      break;
    case 'pwm':
      currentMode = pinModes.PWM;
      break;
    default:
      logError(errors.UNSUPPORTED_PIN_MODE);
  }

  return currentMode;
}

function findPinValue(pin) {
  var el = findByPinNum(pin);
  var valueText = el.find('.valueToggleButton').first().text();
  var currentValue = null;

  // Translate text to actual value
  switch (valueText) {
    case 'high':
      currentValue = 1;
      break;
    case 'low':
      currentValue = 0;
      break;
    default:
      currentValue = Number(valueText);
  }

  return currentValue;
}

function findPWMSliderValue(pin) {
  var el = findByPinNum(pin);
  return Number(el.find('.pwmSlider').first().val());
}


// CLIENT-SIDE SETTERS
function setBoard(type) {
  // Update global
  boardType = type;

  // Update Angular
  var scope = angular.element($(document.body)).scope();
  scope.$apply(function() {
    scope.boardType = boardType;
  });

  initPinButtons();
}

function setPinState(data) {
  console.log(data);

  setPinUIMode(data.pin, data.mode);
  setPinUIValue(data.pin, data.value);
}

function setPinUIMode(pin, mode) {
  if (isPWMPin(pin)) findByPinNum(pin).find('.pwmSlider').first().prop('disabled', true);

  var el = findByPinNum(pin).find('.modeToggleButton').first();

  el.toggleClass('out', false);
  el.toggleClass('in', false);
  el.toggleClass('pwm', false);
  el.toggleClass('analog', false);

  var newClass;
  var newText;

  switch(mode) {
    case 0:
      newClass = 'in';
      newText = 'in';
      break;

    case 1:
      newClass = 'out';
      newText = 'out';
      break;

    case 2:
      newClass = 'analog';
      newText = 'analog';
      break;

    case 3:
      findByPinNum(pin).find('.pwmSlider').first().prop('disabled', false);
      newClass = 'pwm';
      newText = 'pwm';
      break;

    default:
      newText = 'invalid';
  }

  el.toggleClass(newClass, true);
  el.text(newText);
}

function setPinUIValue(pin, value) {
  var el = findByPinNum(pin).find('.valueToggleButton').first();

  el.toggleClass('low', false);
  el.toggleClass('high', false);
  el.toggleClass('numValue', false);

  if (value === 0) {
    el.toggleClass('low', true);
    el.text('low');
  } else if (value === 1) {
    el.toggleClass('high', true);
    el.text('high');
  } else {
    el.toggleClass('numValue', true);
    el.text(value);
  }

  // Add analog queries to textarea
  el = findByPinNum(pin);
  if (el.hasClass('analog')) {
    var textarea = el.find('textarea').first();
    textarea.append(value + '\r');
    textarea.animate({ scrollTop:textarea[0].scrollHeight - textarea.height() },10);
  }
}


// SERVER-SIDE SETTERS
function resetBoard() {
  socket.emit('resetBoard', boardType);

  resetAnalogValues();
}

function resetAnalogValues() {
  /*$('.analogData').each(function() {
    $(this).val('');
  });*/
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

function findPollValue(pin) {
  var el = findByPinNum(pin);
  return Number(el.find('.pollValue').first().val());
}

function setPoll(pin) {
  stopPoll(pin);

  // Add new poll for pin
  var pollValue = findPollValue(pin);

  pinPolls[pin] = window.setInterval(function() {
    socket.emit('getPinState', pin);
  }, pollValue);
}

function stopPoll(pin) {
  if (pinPolls[pin] !== null) {
    window.clearInterval(pinPolls[pin]);
  }
}


// SCRIPTING
function initScriptButtons() {
  $('#scriptFileChooser').on('change', function() {
    openScript(this.files[0]);
  });

  $('#saveScriptButton').on('click', function() {
    saveScript(getScriptContent());
  });

  $('#runScriptButton').on('click', function() {
    runScript(getScriptContent());
  });

  $('#stopScriptButton').on('click', stopScript);

  $('#inputButton').on('click', showInputArea);
  $('#outputButton').on('click', showOutputArea);
}

function showInputArea() {
  $('#script').find('#inputText').first().css('display', 'block');
  $('#script').find('#outputText').first().css('display', 'none');
}

function showOutputArea() {
  $('#script').find('#inputText').first().css('display', 'none');
  $('#script').find('#outputText').first().css('display', 'block');
}

// INPUT
var ide = null;
function initEditor() {
  var container = document.getElementById('inputText');

  ide = CodeMirror(container, {
    // TODO: use a default file
    value: "function myScript(){return 100;}\n",
    mode:  "javascript",
    lineWrapping: true,
    lineNumbers: true
  });
}

function getScriptContent() {
  return ide.getValue();
}

function setScriptContent(text) {
  ide.setValue(text);
}

function openScript(file) {
  var reader = new FileReader();

  reader.addEventListener('load', function(e) {
    var text = e.target.result;
    setScriptContent(text);
  });

  reader.readAsText(file);
}

function saveScript(text) {
  var downloadData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);

  $('#saveScriptButton').attr({
    'href': downloadData,
    'target': '_blank'
  });
}

// OUTPUT
function getScriptOutput() {
  var textarea = $('#script').find('#outputText').first();
  return textarea.val();
}

function setScriptOutput(text) {
  var textarea = $('#script').find('#outputText').first();
  textarea.val(text);
}

// RUNNING
var runningScriptId = null;

function runScript(text) {
  stopScript();
  eval(text); // jshint ignore:line

  setScriptOutput('');
  showOutputArea();
}

function stopScript() {
  if (runningScriptId !== null) {
    clearInterval(runningScriptId);
  }
}

// USER FUNCTIONS
function loop(interval, cb) {
  runningScriptId = setInterval(cb, interval);
}

function display(data) {
  setScriptOutput(getScriptOutput() + data);
}

