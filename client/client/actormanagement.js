var config = require('./config');
var logger = require('./logger');

exports.registeredActors = {};

exports.init = function(options)
{
    //do not reregister
    if (Object.keys(exports.registeredActors).length !== 0)
    {
        logger.info("Actors already registered, skipping.");
        return exports.registeredActors;
    }

    // ----------------------------------------------------

    var display = require('./actors/display');
    exports.registeredActors["display"] = new display();

    // ----------------------------------------------------

    var switchrc = require('./actors/switchrc');
    exports.registeredActors["switchrc"] = new switchrc();

    // ----------------------------------------------------

    var led = require('./actors/led');
    exports.registeredActors["led"] = new led({
        pin_red: 40,
        pin_green: 13
    });

    // ----------------------------------------------------

    var music = require('./actors/music');
    exports.registeredActors["music"] = new music();

    // ----------------------------------------------------

    var servo = require('./actors/servo');
    exports.registeredActors["servo"] = new servo({
        pin: 32
    });

    // ----------------------------------------------------

    var voice = require('./actors/voice');
    exports.registeredActors["voice"] = new voice();

    // ----------------------------------------------------

    var cam = require('./actors/cam');
    exports.registeredActors["cam"] = new cam();

    // ----------------------------------------------------

    var set_temperature_homematic = require('./actors/set_temperature_homematic');
    exports.registeredActors["set_temperature_homematic"] = new set_temperature_homematic();

    // ----------------------------------------------------

    var set_temperature_zwave = require('./actors/set_temperature_zwave');
    exports.registeredActors["set_temperature_zwave"] = new set_temperature_zwave();

    // ----------------------------------------------------

    var ledstrip = require('./actors/ledstrip');
    exports.registeredActors["ledstrip"] = new ledstrip();

    // ----------------------------------------------------

    var recorder = require('./actors/recorder');
    exports.registeredActors["recorder"] = new recorder();

    // ----------------------------------------------------

    var switchzwave = require('./actors/switchzwave');
    exports.registeredActors["switchzwave"] = new switchzwave();

    // ----------------------------------------------------

    var http = require('./actors/http');
    exports.registeredActors["http"] = new http();

    // ----------------------------------------------------


    var stepper = require('./actors/stepper');
    exports.registeredActors["stepper"] = new stepper({
        pin1: 8,
        pin2: 10,
        pin3: 12,
        pin4: 18
    });
    exports.registeredActors["stepper"].off();

    // ----------------------------------------------------

    return exports.registeredActors;
};