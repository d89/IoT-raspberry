var logger = require('./logger');

var display = require('./actors/display');
var switchrc = require('./actors/switchrc');
var ledGreen = require('./actors/led-green');
var ledRed = require('./actors/led-red');

exports.registeredActors = {
    display: display,
    switchrc: switchrc,
    ledGreen: ledGreen,
    ledRed: ledRed
};