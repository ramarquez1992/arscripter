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


function logError(err) {
    alert('ERROR: ' + err);
}


// INIT
var socket = io.connect('http://localhost:8080');
var boardType = boardTypes.uno;

$(document).ready(function() {
  initSocket();
  initScriptButtons();
  initEditor();
  initAnalogCharts(); // Init even when board is never connected
});

function initSocket() {
  socket.on('setBoard', setBoard);
  socket.on('setPinState', setPinState);
  socket.on('errorMet', logError);
}

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

var editor = null;
function initEditor() {
  var defaultScript;
  $.ajax({
    dataType: 'text',
    url: '../js/defaultScript.js',
    async: false,
    success: function(data) {
      defaultScript = data;
    }
  });
  
  var container = document.getElementById('inputText');
  
  editor = CodeMirror(container, {
    value: defaultScript,
    mode:  "javascript",
    lineWrapping: true,
    lineNumbers: true
  });
}

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

}

function initAnalogPolls(interval) {
  for (var pin in boardType.analogPins) {
    setPoll(boardType.analogPins[pin], interval);
  }
}

function initAnalogCharts() {
  $('.analogDataChart').each(function() {
    $(this).peity('line', { width: 170 });
  });
}

var app = angular.module('mainApp', ['ngRoute']);
app.controller('mainController', function($scope) {
  // Expose to $scope
  $scope.boardType = boardType;
  $scope.isPWMPin = isPWMPin;

});


// PIN INFO
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

