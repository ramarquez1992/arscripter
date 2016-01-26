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

function isAnalogPin(pin) {
  var el = findByPinNum(pin);
  var result = false;

  if (el.hasClass('analog')) {
    result = true;
  }

  return result;
}

function isPWMPin(pin) {
  var el = findByPinNum(pin);
  var result = false;

  
  if (el.find('.pwm').length > 0) {
    result = true;
  }

  return result;
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
  $('.button').off('click');
  $('.button').off('input');


  $('.queryStateButton').on('click', function() {
    socket.emit('queryState', findPinNum($(this)));
  });
  
  $('.modeToggleButton').on('click', function() {
    var pinNum = findPinNum($(this));

    if (isAnalogPin(pinNum)) {
      socket.emit('toggleAnalogMode', pinNum);
    } else if (isPWMPin(pinNum)) {
      socket.emit('togglePWMMode', pinNum);
    } else {
      socket.emit('toggleDigitalMode', pinNum);
    }
  });

  $('.valueToggleButton').on('click', function() {
    socket.emit('toggleDigitalValue', findPinNum($(this)));
  });

  $('.pwmSlider').on('input', function() {
    var pin = findPinNum($(this));
    var value = findPinPWMValue($(this));

    socket.emit('setPWMValue', { pin: pin, value: value });
  });


  // ANALOG POLLS
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
}

function setPinToInput(pin) {
  //set mode signal element to input
  if (isPWMPin(pin)) findByPinNum(pin).find('.pwmSlider').first().prop('disabled', true);

  var el = findByPinNum(pin).find('.digitalValueToggleButton').first();

  el.toggleClass('low', false);
  el.toggleClass('high', false);
  el.toggleClass('pwmValue', false);

  if (value === 0) {
    el.toggleClass('low', true);
    el.text('low');
  } else if (value === 1) {
    el.toggleClass('high', true);
    el.text('high');
  } else {
    el.toggleClass('pwmValue', true);
    el.text(value);
  }
}

function setPinToOutput(pin) {
  if (isPWMPin(pin)) findByPinNum(pin).find('.pwmSlider').first().prop('disabled', true);
}

function setPinToAnalog(pin) {
  if (isPWMPin(pin)) findByPinNum(pin).find('.pwmSlider').first().prop('disabled', true);
}

function setPinToPWM(pin) {
  findByPinNum(pin).find('.pwmSlider').first().prop('disabled', false);
}

function setPinMode(pin, mode) {
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

function setPinValue(pin, value) {
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
}

function initSocket() {
  socket.on('queriedState', function(data) {
    console.log(data);

    setPinMode(data.pin, data.mode);
    setPinValue(data.pin, data.value);

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

