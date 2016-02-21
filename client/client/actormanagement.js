var logger = require('./logger');

var display = require('./actors/display');
var switchrc = require('./actors/switchrc');
var led = require('./actors/led');
var music = require('./actors/music');
var servo = require('./actors/servo');
var voice = require('./actors/voice');
var cam = require('./actors/cam');

exports.registeredActors = {
    display: display,
    switchrc: switchrc,
    led: led,
    music: music,
    servo: servo,
    voice: voice,
    cam: cam
};