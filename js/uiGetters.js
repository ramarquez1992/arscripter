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

