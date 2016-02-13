var logger = require('./logger');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');

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

var display = require('./actors/display');
var switchRc = require('./actors/switchrc');
var ledGreen = require('./actors/led-green');
var ledRed = require('./actors/led-red');

ledGreen.act();
ledRed.act();

var sensormanagement =
{
    actionsEnabled: false, //toggle sound actions by clap

    sensorUpdateCallback: null,

    init: function(cb)
    {
        var isFirstConnection = (sensormanagement.sensorUpdateCallback === null);

        sensormanagement.sensorUpdateCallback = function(type, data)
        {
            logger.info("got data", type, data);

            cb({
                type: type,
                data: data
            });

            if (type == "mem")
            {
                sensormanagement.displayUpdate(data);
            }
        };

        if (isFirstConnection)
        {
            logger.warn("First connect, registering the sensors");

            var hum = new humidity({
                onData: sensormanagement.sensorUpdateCallback
            });

            var tmp = new temperature({
                onData: sensormanagement.sensorUpdateCallback
            });

            var cpu = new cputemp({
                onData: sensormanagement.sensorUpdateCallback
            });

            var lv = new lightintensity({
                onData: sensormanagement.sensorUpdateCallback
            });

            var p = new poti({
                onData: sensormanagement.sensorUpdateCallback
            });

            var move = new movement({
                port: 33,
                suffix: "1",
                onData: sensormanagement.sensorUpdateCallback
            });

            var move = new movement({
                port: 38,
                suffix: "2",
                onData: sensormanagement.sensorUpdateCallback
            });

            var ts = new tapswitch({
                onData: sensormanagement.sensorUpdateCallback
            });

            var ss = new sound({
                onData: sensormanagement.sensorUpdateCallback
            });

            var sv = new soundvol({
                onData: sensormanagement.sensorUpdateCallback
            });

            var l = new load({
                onData: sensormanagement.sensorUpdateCallback
            });

            var ls = new light({
                onData: sensormanagement.sensorUpdateCallback
            });

            var m = new mem({
                onData: sensormanagement.sensorUpdateCallback
            });

            var d = new distance({
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
                display.act([
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