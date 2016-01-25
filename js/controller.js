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

  return Number(el.attr('id'));
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
