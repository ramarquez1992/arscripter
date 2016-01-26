// INIT
var app = angular.module('mainApp', ['ngRoute']);
var socket = io.connect('http://localhost:8080');


// BOARD CONFIGURATIONS

app.controller('mainController', function($scope) {
  $scope.boardTypes = {
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
      'digitalPins': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      'analogPins': [14, 15, 16, 17, 18, 19],
      'pwmPins': [3, 5, 6, 9, 10, 11]
    }
  };

  // Set board type to uno initially
  $scope.board = $scope.boardTypes.uno;

  $scope.boardChanged = function() {
    var newBoardType = $('#boardType').val();

    $scope.board = $scope.boardTypes[newBoardType];
    initButtons();

    socket.emit('initBoard', { digitalPinCount: $scope.board.digitalPins.length, analogPinCount: $scope.board.analogPins.length });
  };

  $scope.isPWM = function(pin) {
    return ($.inArray(pin, $scope.board.pwmPins) > -1 ? true : false);
  };

});


// POLL MANAGEMENT
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

function findByPinNum(n) {
  var el = {};

  $('.pin').each(function() {
    if (n == Number($(this).find('meta[name="pinNum"]').first().attr('content'))) {
      el = $(this);
    }
  });

  return el;
}

function findPinPWMValue(el) {
  while (!el.hasClass('pin')) {
    el = el.parent();
  }

  return Number(el.find('.pwmSlider').first().val());
}

function findPollValue(el) {
  while (!el.hasClass('pin')) {
    el = el.parent();
  }

  return Number(el.find('.pollValue').first().val());
}


// INIT
function initButtons() {
  // Remove all previous handlers to avoid duplicates
  $('button').off('click');


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
    var value = findPinPWMValue($(this));

    socket.emit('setPWMValue', { pin: pin, value: value });
  });

  $('.pwmSlider').on('input', function() {
    var pin = findPinNum($(this));
    var value = findPinPWMValue($(this));

    socket.emit('setPWMValue', { pin: pin, value: value });
  });

  // ANALOG PINS
  $('.analogModeToggleButton').on('click', function() {
    socket.emit('toggleAnalogMode', findPinNum($(this)));
  });
}

function initSocket() {
  socket.on('queriedState', function(data) {
    console.log(data);

    // Add analog queries to textarea
    var el = findByPinNum(data.pin);
    if (el.hasClass('analog')) {
      var textarea = el.find('textarea').first();
      textarea.append(data.value + '\r');
      textarea.animate({scrollTop:textarea[0].scrollHeight - textarea.height()},10);
    }
  });
}


$(document).ready(function() {
  initButtons();
  initSocket();
});

