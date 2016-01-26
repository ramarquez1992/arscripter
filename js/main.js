// ANGULAR
var app = angular.module('mainApp', ['ngRoute']);

var boardTypes = {
  'uno': {
    'name': 'UNO',
    'digitalPins': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    'analogPins': [14, 15, 16, 17, 18, 19],
    'pwmPins': [3, 5, 6, 9, 10, 11]
  },

  /*'mega': {
    'name': 'Mega 2560',
    'digitalPins': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    'analogPins': [14, 15, 16, 17, 18, 19]
  },*/
  
  'zero': {
    'name': 'ZERO',
    'digitalPins': [0, 1, 2],
    'analogPins': [3, 4],
    'pwmPins': [0]
  }
};


app.controller('mainController', function($scope) {
  $scope.boardTypes = boardTypes;

  $scope.digitalPins = boardTypes.uno.digitalPins;
  $scope.analogPins = boardTypes.uno.analogPins;
  $scope.pwmPins = boardTypes.uno.pwmPins;

  $scope.boardChanged = function() {
    var newBoardType = $('#boardType').val();

    $scope.digitalPins = boardTypes[newBoardType].digitalPins;
    $scope.analogPins = boardTypes[newBoardType].analogPins;
    $scope.pwmPins = boardTypes[newBoardType].pwmPins;
  };

  $scope.isPWM = function(pin) {
    return ($.inArray(pin, $scope.pwmPins) > -1 ? true : false);
  };

});


var socket = io.connect('http://localhost:8080');

// QUERY HANDLERS
var pinPolls = {};

function stopPoll(pin) {
  if (pinPolls[pin] !== null) {
    window.clearInterval(pinPolls[pin]);
  }
}


// EXTRACT PIN INFO FROM ELEMENTS
function findPinNum(el) {
  while (!el.hasClass('pin')) {
    el = el.parent();
  }

  return Number(el.find('meta[name="pinNum"]').first().attr('content'));
}

function findPinValue(el) {
  while (!el.hasClass('pin')) {
    el = el.parent();
  }

  return Number(el.find('.valueText').first().val());
}

function findPollValue(el) {
  while (!el.hasClass('pin')) {
    el = el.parent();
  }

  return Number(el.find('.pollValue').first().val());
}


// INIT
$(document).ready(function() {

  // POLLS
  $('.stopPollButton').on('click', function() {
    stopPoll(findPinNum($(this)));
  });

  $('.setPollButton').on('click', function() {
    var pinNum = findPinNum($(this));
    var pollValue = findPollValue($(this));

    stopPoll(pinNum);

    // Add new poll for pin
    pinPolls[pinNum] = window.setInterval(function() {
      socket.emit('queryState', pinNum);
    }, pollValue);
  });

  $('.queryStateButton').on('click', function() {
    socket.emit('queryState', findPinNum($(this)));
  });

  socket.on('queriedState', function(data) {
    console.log(data);

    // Add analog queries to textarea
    var el = $('#' + data.pin);
    if (el.hasClass('analog')) {
      var textarea = el.find('textarea').first();
      textarea.append(data.value + '\r');
      textarea.animate({scrollTop:textarea[0].scrollHeight - textarea.height()},10);
    }
  });


  // DIGITAL PINS
  $('.digitalModeToggleButton').on('click', function() {
    socket.emit('toggleDigitalMode', findPinNum($(this)));
  });

  $('.digitalValueToggleButton').on('click', function() {
    socket.emit('toggleDigitalValue', findPinNum($(this)));
  });


  // PWM PINS
  $('.pwmModeToggleButton').on('click', function() {
    socket.emit('togglePWMMode', findPinNum($(this)));
  });

  $('.pwmValueSetButton').on('click', function() {
    var pin = findPinNum($(this));
    var value = findPinValue($(this));

    socket.emit('setPWMValue', { pin: pin, value: value });
  });


  // ANALOG PINS
  $('.analogModeToggleButton').on('click', function() {
    socket.emit('toggleAnalogMode', findPinNum($(this)));
  });

});
