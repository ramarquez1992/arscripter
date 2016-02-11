var pin = 13;
setPinMode(pin,1);

loop(1000, function() {  
  toggleDigitalValue(pin);

  setTimeout(function() {
  	display('Pin ' + pin + ' value: ' + getPinValue(pin) + '\n');
  }, 10);
  
});

