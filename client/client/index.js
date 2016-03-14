var config = require('./config');
var exec = require('child_process').exec;
var fs = require('fs');
var logger = require('./logger');
var socketmanager = require('./socketmanager');
var sensormanagement = require('./sensormanagement');
var actormanagement = require('./actormanagement');
var conditionparser = require('./conditionparser');
//---------------------------------------------------------------------------

exports.displayUpdate = function(memUsage)
{
    if (!("display" in actormanagement.registeredActors)) return;

    exec("ps aux | grep python | wc -l", function(err, out1, stderr)
    {
        exec("ps aux | grep node | wc -l", function(err, out2, stderr)
        {
            actormanagement.registeredActors.display.print([
                "python-proc: " + parseInt(out1, 10),
                "node-proc: " + parseInt(out2, 10),
                "mem-usage " + memUsage.toFixed(2) + "%",
                "load: " + fs.readFileSync("/proc/loadavg").toString().split(" ").splice(0, 3).join(" ")
            ]);
        });
    });
};

exports.start = function()
{
    var isFirstConnection = socketmanager.socket === null;

    var sensorUpdateCallback = function(type, data)
    {
        //console.log("received " + data + " for " + type);

        //logger.info("new sensor data: ", data);
        socketmanager.socket.emit("client:data", {
            type: type,
            data: data,
            created: (new Date).getTime()
        });

        conditionparser.process(type, data);

        if (type == "mem")
        {
            exports.displayUpdate(data);
        }
    };

    logger.info("------------------------------------------------------");
    logger.info("BINDING ACTORS");

    actormanagement.init();

    if (isFirstConnection)
    {
        //turn stepper engine off on first connection. It's possible that the led pins
        //are initialized in a way that one (or more) of the 4 control pins are high so
        //the stepper engine can not completely turn off
        actormanagement.registeredActors["stepper"].off();

        //toggle the relais. I connected my display to the relais output which shows
        //gibberish after boot so the display needs a power cycle
        actormanagement.registeredActors["relais"].toggle();
    }

    logger.info("------------------------------------------------------");
    logger.info("BINDING SENSORS");

    sensormanagement.init({
        onData: sensorUpdateCallback
    });

    logger.info("------------------------------------------------------");

    var sensorsForServer = [];

    for (var sensorName in sensormanagement.registeredSensors)
    {
        var sensor = sensormanagement.registeredSensors[sensorName];

        if (sensor.sendToServer)
        {
            sensorsForServer.push({
                name: sensor.name,
                description: sensor.description
            });
        }
    }

    //------------------------------------------------------

    var actorsForServer = [];

    for (var actorName in actormanagement.registeredActors)
    {
        var actor = actormanagement.registeredActors[actorName];

        actorsForServer.push({
            name: actor.name,
            options: []
        });
    }

    logger.info(`client ${socketmanager.clientName} connecting to ${socketmanager.serverUrl}`);

    socketmanager.socket = socketmanager.getConnectionHandle(sensorsForServer, actorsForServer);

    if (isFirstConnection)
    {
        socketmanager.bindCallbacks();
    }
};

//---------------------------------------------------------------------------

exports.start();