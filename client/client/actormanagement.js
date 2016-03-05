var logger = require('./logger');

var display = require('./actors/display');
var switchrc = require('./actors/switchrc');
var led = require('./actors/led');
var music = require('./actors/music');
var servo = require('./actors/servo');
var voice = require('./actors/voice');
var cam = require('./actors/cam');
var set_temperature_homematic = require('./actors/set_temperature_homematic');
var set_temperature_zwave = require('./actors/set_temperature_zwave');
var ledstrip = require('./actors/ledstrip');
var recorder = require('./actors/recorder');

exports.registeredActors = {
    display: display,
    switchrc: switchrc,
    led: led,
    music: music,
    servo: servo,
    voice: voice,
    cam: cam,
    set_temperature_homematic: set_temperature_homematic,
    set_temperature_zwave: set_temperature_zwave,
    ledstrip: ledstrip,
    recorder: recorder
};