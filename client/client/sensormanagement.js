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

actormanagement.registeredActors.ledGreen.act();
actormanagement.registeredActors.ledRed.act();

var sensormanagement =
{
    actionsEnabled: false, //toggle sound actions by clap

    sensorUpdateCallback: null,

    registeredSensors : {},

    init: function(cb)
    {
        var isFirstConnection = (sensormanagement.sensorUpdateCallback === null);

        sensormanagement.sensorUpdateCallback = function(type, data)
        {
            cb({
                type: type,
                data: data
            });

            conditionparser.process(type, data, sensormanagement.registeredSensors, actormanagement.registeredActors);

            if (type == "mem")
            {
                sensormanagement.displayUpdate(data);
            }
        };

        if (isFirstConnection)
        {
            logger.warn("First connect, registering the sensors");

            sensormanagement.registeredSensors["humidity"] = new humidity({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["temperature"] = new temperature({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["cputemp"] = new cputemp({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["lightintensity"] = new lightintensity({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["poti"] = new poti({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["movement1"] = new movement({
                port: 33,
                suffix: "1",
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["movement2"] = new movement({
                port: 38,
                suffix: "2",
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["tapswitch"] = new tapswitch({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["sound"] = new sound({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["soundvol"] = new soundvol({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["load"] = new load({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["light"] = new light({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["mem"] = new mem({
                onData: sensormanagement.sensorUpdateCallback
            });

            sensormanagement.registeredSensors["distance"] = new distance({
                onData: sensormanagement.sensorUpdateCallback
            });
        }
        else
        {
            logger.warn("reconnect, not registering the sensors");
        }
    },

    //##########################################################################

    displayUpdate: function(memUsage)
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
    }
};

module.exports = sensormanagement;