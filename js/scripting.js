function showInputArea() {
  $('#script').find('#inputText').first().css('display', 'block');
  $('#script').find('#outputText').first().css('display', 'none');
}

function showOutputArea() {
  $('#script').find('#inputText').first().css('display', 'none');
  $('#script').find('#outputText').first().css('display', 'block');
}

// INPUT
function getScriptContent() {
  return editor.getValue();
}

function setScriptContent(text) {
  editor.setValue(text);
}

function openScript(file) {
  var reader = new FileReader();
  
  reader.addEventListener('load', function(e) {
    var text = e.target.result;
    setScriptContent(text);
  });
  
  reader.readAsText(file);
  showInputArea();
}

function saveScript(text) {
  var downloadData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  
  $('#saveScriptButton').attr({
    'href': downloadData,
    'target': '_blank'
  });
}

// OUTPUT
function getScriptOutput() {
  var textarea = $('#script').find('#outputText').first();
  return textarea.val();
}

function setScriptOutput(text) {
  var textarea = $('#script').find('#outputText').first();
  textarea.val(text);
}

// RUNNING
var runningScriptId = null;

function runScript(text) {
  stopScript();
  eval(text); // jshint ignore:line
  
  setScriptOutput('');
  showOutputArea();
}

function stopScript() {
  if (runningScriptId !== null) {
    clearInterval(runningScriptId);
  }
}

// USER FUNCTIONS
function loop(interval, cb) {
  runningScriptId = setInterval(cb, interval);
}

function display(data) {
  setScriptOutput(getScriptOutput() + data);
}

function getPinValue(pin) {
  return findPinValue(pin);
}

function getPinMode(pin) {
  return findPinMode(pin);
}

