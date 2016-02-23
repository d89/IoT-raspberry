var logger = require('./logger');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var conditionparser = require('./conditionparser');
var actormanagement = require('./actormanagement');
var config = require('./config');
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
var time = require('./sensors/time');
var date = require('./sensors/date');
var reachability = require('./sensors/reachability');
var desired_temperature_homematic = require('./sensors/desired_temperature_homematic');
var measured_temperature_homematic = require('./sensors/measured_temperature_homematic');

// ------------------------------------------------------

actormanagement.registeredActors.led.green();
actormanagement.registeredActors.led.red();

// ------------------------------------------------------

exports.sensorUpdateCallback = null;

exports.registeredSensors = {};

exports.init = function(cb)
{
    var isFirstConnection = (exports.sensorUpdateCallback === null);

    exports.sensorUpdateCallback = function(type, data)
    {
        //console.log("received " + data + " for " + type);
        
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

        var sentTimeDatapoints = 0;
        exports.registeredSensors["time"] = new time({
            onData: function(type, data)
            {
                if (sentTimeDatapoints % 5 === 0)
                    exports.sensorUpdateCallback(type, data);

                sentTimeDatapoints++;
            }
        });

        exports.registeredSensors["date"] = new date({
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["movement1"] = new movement({
            pin: 33,
            suffix: "1",
            onData: exports.sensorUpdateCallback
        });

        exports.registeredSensors["movement2"] = new movement({
            pin: 38,
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

        exports.registeredSensors["reachability"] = new reachability({
            onData: exports.sensorUpdateCallback,
            ip: config.smartphoneIp
        });

        exports.registeredSensors["desired_temperature_homematic"] = new desired_temperature_homematic({
            onData: exports.sensorUpdateCallback,
            thermostatName: "HM_37F678"
        });

        exports.registeredSensors["measured_temperature_homematic"] = new measured_temperature_homematic({
            onData: exports.sensorUpdateCallback,
            thermostatName: "HM_37F678"
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