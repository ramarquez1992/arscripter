# arscripter
A web-based approach to rapid Arduino prototyping. Program your Arduino board straight from the browser using JavaScript and GUI controls.


## Requirements
- [Arduino IDE](https://www.arduino.cc/en/Main/Software)
- [Node.js](https://nodejs.org/en/)
- [PingFirmata](http://johnny-five.io/api/proximity/#pingfirmata)


## Installation
`npm install -g arscripter`


## Usage
1. Connect  Arduino via USB
1. Execute `arscripter`
1. Navigate to [`http://localhost:8080`](http://localhost:8080) in web browser


- Toggle the mode and/or value of a pin by clicking on the appropriate label
- PWM values can be set via the adjacent slider
- Analog values can be viewed in the adjacent graph


## API
- `loop(ms, handler())`<br/>Execute the `handler` function every `ms` milliseconds

- `display(msg)`<br/>Print `msg` to the output pane


- `getPinValue(pin)`<br/>Returns the current value of the given `pin`


- `setPinValue(pin, value)`<br/>Write a `value` to a given `pin`


- `toggleDigitalValue(pin)`<br/>Write the opposite of the current value of a given `pin`


- `getPinMode(pin)`<br/>Returns the current mode of the given `pin`


- `setPinMode(pin, mode)`<br/>Set the mode of a given `pin`, one of the possible pin modes (see below)


## Pin Modes
- `0`: Input
- `1`: Output
- `2`: Analog
- `3`: PWM


## Basic Script
```javascript
var pin = 13;
setPinMode(pin,1);

loop(1000, function() {  
  toggleDigitalValue(pin);

  setTimeout(function() {
  	display('Pin ' + pin + ' value: ' + getPinValue(pin) + '\n');
  }, 10);
  
});
```


## Notes
- The first analog pin is reached at the number following the last digital pin (e.g. the last digital pin on the Uno is pin 13, so A0 is pin 14).


<!--
![image](https://github.com/richard92m/web-arduino/raw/master/assets/led-blink.gif)
-->
