//---------------------------------------------------------------------------

var io = require('socket.io-client');
var config = require('./config');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var logger = require('./logger');
var sensormanagement = require('./sensormanagement');
var actormanagement = require('./actormanagement');
var conditionparser = require('./conditionparser');
var socketmanager = require('./socket');

var cam = require('./actors/cam');
var switchRc = require('./actors/switchrc');
var ledGreen = require('./actors/led-green');
var ledRed = require('./actors/led-red');
var servo = require('./actors/servo');
var socket = socketmanager.getConnectionHandle();

logger.info(`client ${socketmanager.clientName} connecting to ${socketmanager.serverUrl}`);

socketmanager.socket.on('connect', function()
{
    if (!socketmanager.socket.connected)
    {
        return;
    }

    logger.info(`connected to ${socketmanager.serverUrl}`);

    sensormanagement.init(function(data)
    {
        //logger.info("new sensor data: ", data);
        socketmanager.socket.emit("client:data", data);
    });
});

socketmanager.socket.on('actionrequest', function(msg)
{
    /*
    known messages:
         { type: 'switchrc', data: { switchNumber: '1', onoff: '0' } }
         { type: 'led', data: { ledType: 'red' } }
     */

    if (!msg.type)
    {
        logger.info("malformatted actionrequest");
        return;
    }

    //RC SWITCH  -----------------------------------------------------------------------
    if (msg.type === "switchrc")
    {
        var switchNumber = msg.data.switchNumber;
        var onoff = msg.data.onoff;

        logger.info(`actionrequest for rc switch ${switchNumber} to status ${onoff}`);

        switchRc.act(1, switchNumber, onoff);
    }

    if (msg.type === "servo")
    {
        var onoff = msg.data.onoff;

        logger.info(`actionrequest for servo to status ${onoff}`);

        servo.act(onoff);
    }

    //LED ------------------------------------------------------------------------------
    if (msg.type === "led")
    {
        logger.info(`actionrequest for LED ${msg.data.ledType}`);

        if (msg.data.ledType === "red")
        {
            ledRed.act();
        }
        else if (msg.data.ledType === "green")
        {
            ledGreen.act();
        }
    }
});

socketmanager.socket.on('ifttt', function(msg, resp)
{
    //conditionlist  --------------------------------------------------------------------
    if (msg.mode === "conditionlist")
    {
        logger.info("ifttt request for conditionslist");

        conditionparser.loadConditions(function(err, conds)
        {
            try
            {
                var parsedConditions = JSON.parse(conds);

                //send initial state
                conditionparser.sendStatusUpdateToServer();
            }
            catch (err)
            {
                logger.error("could not load ifttt conditions", err, conds);
                return resp("parsing error");
            }

            return resp(err, parsedConditions);
        });
    }

    //availableoptions  -----------------------------------------------------------------
    if (msg.mode === "availableoptions")
    {
        logger.info("ifttt request for availableoptions");

        conditionparser.loadAvailableOptions(function(err, availableOptions)
        {
            return resp(err, availableOptions);
        });
    }

    //saveconditions  -------------------------------------------------------------------
    if (msg.mode === "saveconditions")
    {
        logger.info("ifttt request for saveconditions with conds", msg.conditions);

        try
        {
            var conditions = JSON.stringify(msg.conditions);
        }
        catch (err)
        {
            logger.error("could not parse ifttt conditions", err, msg.conditions);
            return resp("parsing error");
        }

        conditionparser.saveConditions(conditions, function(err, conds)
        {
            return resp(err, conds);
        });
    }

    //parseconditions  -------------------------------------------------------------------
    if (msg.mode === "testconditions")
    {
        logger.info("ifttt request for testconditions");

        conditionparser.testConditions(msg.testconditions, function(err, data)
        {
            return resp(err, data);
        });
    }
});

//request from server client (passed by ui)
socketmanager.socket.on('start-start-stream', function(msg)
{
    var start = !!msg.start;

    if (start)
    {
        logger.info("Received stream start request");
        if (!cam.streamRunning) {
            cam.startStreaming(socket);
        } else {
            cam.sendImage();
        }
    }
    else
    {
        logger.info("Received stream stop request");
        cam.stopStreaming();
    }
});

socketmanager.socket.on('maintenance', function(msg, cb)
{
    logger.info("received maintenance request", msg);

    if (msg.mode === "shutdown")
    {
        spawn("/sbin/shutdown", ["now"]);
    }
    else if (msg.mode === "restart")
    {
        spawn("/sbin/reboot", ["now"]);
    }
    else //log
    {
        fs.readFile(config.logFile, "utf8", function(err, logfileRaw)
        {
            var logfile = [];

            if (err) {
                err = "" + err;
            }
            else {
                var logfileRaw = logfileRaw.toString().split("\n").reverse();

                var max = Math.min(logfileRaw.length, 30);

                for (var i = 0; i < max; i++)
                {
                    if (!logfileRaw[i].length) continue;

                    try {
                        logfile.push(JSON.parse(logfileRaw[i]));
                    } catch (err) {
                        logger.info("JSON parse error for " + logfileRaw[i]);
                    }
                }
            }

            if (!logfile.length || (err && err.indexOf("no such file or directory") !== -1))
            {
                err = null;

                logfile.push({
                    level: "error",
                    message: "log file " + config.logFile + " missing",
                    timestamp: new Date()
                });
            }

            return cb(err, logfile);
        });
    }
});

socketmanager.socket.on('disconnect', function()
{
	logger.info(`disconnected from ${socketmanager.serverUrl}`);
    cam.stopStreaming();

    //if we receive a real "disconnect" event, the reconnection is not automatically being established again
    setTimeout(function()
    {
        logger.info(`establishing reconnection`);
        socketmanager.socket = socketmanager.getConnectionHandle();
    }, 2000);
});