function setBoard(type) {
  // Update global
  boardType = type;

  // Update Angular
  var scope = angular.element($(document.body)).scope();
  scope.$apply(function() {
    scope.boardType = boardType;
  });

  initPinButtons();
  initAnalogCharts();
  initAnalogPolls(250);
}

function setPinState(data) {
  //console.log(data);

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
  var el = findByPinNum(pin);
  var button = el.find('.valueToggleButton').first();

  button.toggleClass('low', false);
  button.toggleClass('high', false);
  button.toggleClass('numValue', false);

  if (value === 0) {
    button.toggleClass('low', true);
    button.text('low');
  } else if (value === 1) {
    button.toggleClass('high', true);
    button.text('high');
  } else {
    button.toggleClass('numValue', true);
    button.text(value);
  }

  // Add analog queries to textarea
  if (el.hasClass('analog')) {
    updateAnalogChart(pin, value);
  }
}

function updateAnalogChart(pin, value) {
  var el = findByPinNum(pin);
  var analogDataChart = el.find('.analogDataChart').first();

  var oldValues = analogDataChart.text().split(',');

  var maxValueCount = 50;
  if (oldValues.length > maxValueCount) {
    oldValues.shift();
  }

  oldValues.push(value);
  var newValues = oldValues.join(',');

  analogDataChart.text(newValues);
  analogDataChart.change();
}

function resetAnalogCharts() {
  $('.analogDataChart').each(function() {
    $(this).text('0');
    $(this).change();
  });
}

