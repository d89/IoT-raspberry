var logger = require('./logger');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var conditionparser = require('./conditionparser');
var actormanagement = require('./actormanagement');

var temperature = require('./sensors/temperature');
var cputemp = require('./sensors/cputemp');
var mem = require('./sensors/mem');
var load = require('./sensors/load');
var humidity = require('./sensors/humidity');
var distance = require('./sensors/distance');
var lightintensity = require('./sensors/lightintensity');
var light = require('./sensors/light');
var soundvol = require('./sensors/soundvol');
var sound = require('./sensors/sound');
var movement = require('./sensors/movement');
var tapswitch = require('./sensors/tapswitch');
var poti = require('./sensors/poti');

// ------------------------------------------------------

actormanagement.registeredActors.ledGreen.act();
actormanagement.registeredActors.ledRed.act();

// ------------------------------------------------------

exports.sensorUpdateCallback = null;

exports.registeredSensors = {};

exports.init = function(cb)
{
    var isFirstConnection = (exports.sensorUpdateCallback === null);

    exports.sensorUpdateCallback = function(type, data)
    {
        cb({
            type: type,
            data: data
        });

        conditionparser.process(type, data);

        if (type == "mem")
        {
            exports.displayUpdate(data);
        }
    };

    if (isFirstConnection)
    {
        logger.warn("First connect, registering the sensors");

        exports.registeredSensors["humidity"] = new humidity({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["temperature"] = new temperature({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["cputemp"] = new cputemp({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["lightintensity"] = new lightintensity({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["poti"] = new poti({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["movement1"] = new movement({
            port: 33,
            suffix: "1",
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["movement2"] = new movement({
            port: 38,
            suffix: "2",
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["tapswitch"] = new tapswitch({
            onData: exports.sensorUpdateCallback,
            restartSensorAfter: false
        });

        exports.registeredSensors["sound"] = new sound({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["soundvol"] = new soundvol({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["load"] = new load({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["light"] = new light({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["mem"] = new mem({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["distance"] = new distance({
            onData: exports.sensorUpdateCallback
        });
    }
    else
    {
        logger.warn("reconnect, not registering the sensors");
    }
};

//##########################################################################

exports.displayUpdate = function(memUsage)
{
    exec("ps aux | grep python | wc -l", function(err, out1, stderr)
    {
        exec("ps aux | grep node | wc -l", function(err, out2, stderr)
        {
            actormanagement.registeredActors.display.act([
                "python-proc: " + parseInt(out1, 10),
                "node-proc: " + parseInt(out2, 10),
                "mem-usage " + memUsage.toFixed(2) + "%",
                "load: " + fs.readFileSync("/proc/loadavg").toString().split(" ").splice(0, 3).join(" ")
            ]);
        });
    });
};