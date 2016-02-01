function mf(p) {
  toggleDigitalValue(p);
}

loop(1000, function() {
  mf(6);

  var date = new Date();
  var time = date.getTime();

  display('TIME: ' + time + '\n');

});
