var logger = require('./logger');

var display = require('./actors/display');
var switchrc = require('./actors/switchrc');
var ledGreen = require('./actors/led-green');
var ledRed = require('./actors/led-red');
var music = require('./actors/music');
var servo = require('./actors/servo');

exports.registeredActors = {
    display: display,
    switchrc: switchrc,
    ledGreen: ledGreen,
    ledRed: ledRed,
    music: music,
    servo: servo
};