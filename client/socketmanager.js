//---------------------------------------------------------------------------

var io = require('socket.io-client');
var crypto = require('crypto');
var fs = require('fs');
var config = require('./config');
var logger = require('./logger');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var audio = require('./audio');
var youtube = require('./youtube');
var conditionparser = require('./conditionparser');
var actormanagement = require('./actormanagement');
var start = require('./index');

exports.serverUrl = config.serverUrl;
exports.clientName = config.clientName;
exports.socket = null;

exports.connect = function(sensorsForServer, actorsForServer)
{
    var capabilities = {
        sensors: sensorsForServer,
        actors: actorsForServer
    };

    capabilities = JSON.stringify(capabilities);

    var connectionParams = [];
    connectionParams.push("mode=client");
    connectionParams.push("password=" + crypto.createHash('sha512').update(config.password).digest('hex'));
    connectionParams.push("connected_at=" + (new Date));
    connectionParams.push("client_name=" + exports.clientName);
    connectionParams.push("capabilities=" + capabilities);

    return io.connect(exports.serverUrl, {query: connectionParams.join("&") });
};

exports.bindCallbacks = function()
{
    exports.socket.on('connect', function()
    {
        if (!exports.socket.connected)
        {
            return;
        }

        // ----------------------------------------------------

        logger.info(`connected to ${exports.serverUrl}`);
    });

    exports.socket.on('actionrequest', function(msg, resp)
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
        if (msg.type === "switchrc" && actormanagement.has("switchrc"))
        {
            var switchNumber = msg.data.switchNumber;
            var onoff = msg.data.onoff;

            logger.info(`actionrequest for rc switch ${switchNumber} to status ${onoff}`);

            actormanagement.registeredActors["switchrc"].turnSwitch(1, switchNumber, onoff);
        }

        //ZW SWITCH  -----------------------------------------------------------------------
        if (msg.type === "switchzwave" && actormanagement.has("switchzwave"))
        {
            var switchName = msg.data.switchName;
            var onoff = msg.data.onoff;

            logger.info(`actionrequest for zwave switch ${switchName} to status ${onoff}`);

            if (onoff)
                actormanagement.registeredActors["switchzwave"].on(switchName);
            else
                actormanagement.registeredActors["switchzwave"].off(switchName);
        }

        //Servo Engine  ---------------------------------------------------------------------
        if (msg.type === "servo" && actormanagement.has("servo"))
        {
            var onoff = msg.data.onoff;

            logger.info(`actionrequest for servo to status ${onoff}`);

            if (onoff)
                actormanagement.registeredActors["servo"].on();
            else
                actormanagement.registeredActors["servo"].off();
        }

        //Relais -----------------------------------------------------------------------------
        if (msg.type === "relais" && actormanagement.has("relais"))
        {
            var onoff = msg.data.onoff;

            logger.info(`actionrequest for relais to status ${onoff}`);

            if (onoff)
                actormanagement.registeredActors["relais"].on();
            else
                actormanagement.registeredActors["relais"].off();
        }

        //Stepper Engine  -------------------------------------------------------------------
        if (msg.type === "stepper" && actormanagement.has("stepper"))
        {
            var onoff = msg.data.onoff;

            logger.info(`actionrequest for stepper to status ${onoff}`);

            if (onoff)
                actormanagement.registeredActors["stepper"].on();
            else
                actormanagement.registeredActors["stepper"].off();
        }

        //LED ------------------------------------------------------------------------------
        if (msg.type === "led" && actormanagement.has("led"))
        {
            logger.info(`actionrequest for LED ${msg.data.ledType}`);

            if (msg.data.ledType === "red")
            {
                actormanagement.registeredActors["led"].red();
            }
            else if (msg.data.ledType === "green")
            {
                actormanagement.registeredActors["led"].green();
            }
        }

        //Voice ------------------------------------------------------------------------------
        if (msg.type === "voice" && actormanagement.has("voice"))
        {
            logger.info(`actionrequest for Voice with text ${msg.data}`);

            actormanagement.registeredActors["voice"].speak(msg.data);
        }

        //Music ------------------------------------------------------------------------------
        if (msg.type === "music" && actormanagement.has("music"))
        {
            var turnOff = msg.data === false;

            if (turnOff) {
                logger.info("turning music off");
                actormanagement.registeredActors["music"].stop();
            } else {
                logger.info(`actionrequest for music with title ${msg.data}`);
                actormanagement.registeredActors["music"].play(msg.data);
            }
        }

        //Recording ---------------------------------------------------------------------------
        if (msg.type === "record" && actormanagement.has("recorder"))
        {
            var start = msg.data.mode === "start";

            if (start) {
                logger.info("start recording");
                actormanagement.registeredActors["recorder"].doRecord(false, msg.data.maxLength, config.mediaBasePath, function(err, fileName)
                {
                    if (err)
                        return resp(err);

                    //the full path is returned, we only want the raw file name
                    if (fileName)
                        return resp(null, path.basename(fileName));
                });
            }
        }

        //Volume Out ------------------------------------------------------------------------
        if (msg.type === "volume" && actormanagement.has("music"))
        {
            var volume = parseFloat(msg.data, 10);

            if (isNaN(volume) || volume < 0 || volume > 100)
            {
                logger.error("invalid volume - setting to default");
                volume = config.volume;
            }

            //Volume ranges from 0 to 100%
            logger.info("setting audio volume to ", volume);

            exec("amixer -c " + config.soundCardOutput + " sset PCM,0 " + volume + "%");

            config.volume = volume;
        }

        //Volume In -------------------------------------------------------------------------
        if (msg.type === "volumemicrophone" && actormanagement.has("recorder"))
        {
            var volume = parseFloat(msg.data, 10);

            if (isNaN(volume) || volume < 0 || volume > 100)
            {
                logger.error("invalid volume - setting to default");
                volume = config.volumemicrophone;
            }

            //Volume ranges from 0 to 100%
            logger.info("setting mic volume to ", volume);

            //unmute mic and set default: https://wiki.ubuntuusers.de/amixer/
            exec("amixer -c " + config.soundCardInput + " sset Mic,0 " + volume + "% unmute cap");
            config.volumemicrophone = volume;
        }

        //Temperature -------------------------------------------------------------------------
        if (msg.type === "settemperature" && actormanagement.hasOneOf(["set_temperature_zwave", "set_temperature_homematic"]))
        {
            var data = msg.data;
            logger.info(`actionrequest for temperature with data`, data);

            if (!("type" in data && "temp" in data && "thermostat" in data))
            {
                return logger.error("invalid set temperature request (1)", data);
            }

            var type = data.type;
            var temp = data.temp;
            var thermostat = data.thermostat;

            if (type === "zwave")
            {
                actormanagement.registeredActors["set_temperature_zwave"].settemp(temp, thermostat);
            }
            else if (type === "homematic")
            {
                actormanagement.registeredActors["set_temperature_homematic"].settemp(temp, thermostat);
            }
            else
            {
                logger.error("invalid set temperature request (2)", msg.data);
            }
        }

        //LED Strip --------------------------------------------------------------------------
        if (msg.type === "ledstrip" && actormanagement.has("ledstrip"))
        {
            logger.info("actionrequest for ledstrip with data", msg.data);

            var mode = msg.data.mode;

            if (mode === "singleColor")
            {
                actormanagement.registeredActors["ledstrip"].singleColor(msg.data.colors.red, msg.data.colors.green, msg.data.colors.blue);
            }
            else if (mode === "colorParty")
            {
                actormanagement.registeredActors["ledstrip"].colorParty();
            }
            else if (mode === "allOff")
            {
                actormanagement.registeredActors["ledstrip"].allOff();
            }
            else if (mode === "randomColor")
            {
                actormanagement.registeredActors["ledstrip"].randomColor();
            }
            else if (mode === "lightshow")
            {
                var style = msg.data.style;

                if (style === "music")
                {
                    var file = msg.data.file;
                    actormanagement.registeredActors["ledstrip"].lightshow(file);
                }
                else if (style === "linein")
                {
                    actormanagement.registeredActors["ledstrip"].synchronize();
                }
            }
            else
            {
                logger.error("invalid led strip command type");
            }
        }

        //YT Download --------------------------------------------------------------------------
        if (msg.type === "youtube" && actormanagement.has("music"))
        {
            youtube.download(msg.data, function onout(text)
                {
                    logger.info(text);
                    exports.socket.emit("client:youtube-download", {
                        output: text
                    });
                },
                function onclose(code, fileName)
                {
                    logger.info("Done with response code: " + code + " and file " + fileName);

                    var resp = { success: true };

                    if (code === 0 && fileName)
                    {
                        resp.file = fileName;
                    }
                    else
                    {
                        resp.success = false;
                    }

                    exports.socket.emit("client:youtube-download", resp);
                });
        }
    });

    exports.socket.on('audio', function(msg, resp)
    {
        if (msg.mode === "list")
        {
            audio.list(function(err, audios)
            {
                if (err)
                {
                    logger.error("audio listing: ", err);
                    return resp(err);
                }

                //logger.info("audio listing: got", audios);

                resp(null, audios);
            });
        }
        else if (msg.mode === "delete")
        {
            audio.delete(msg.file, function(err, msg)
            {
                if (err)
                {
                    logger.error("audio deleting: ", err);
                    return resp(err);
                }

                logger.info("audio deleting: got", msg);

                resp(null, msg);
            });
        }
    });

    exports.socket.on('ifttt', function(msg, resp)
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
            logger.info("ifttt request for saveconditions");

            try
            {
                var conditions = JSON.stringify(msg.conditions);
                console.log("saving conditions", msg.conditions);
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
    exports.socket.on('start-stop-stream', function(msg, resp)
    {
        var start = !!msg.start;

        if (start)
        {
            logger.info("Received stream start request");

            if (actormanagement.registeredActors["cam"].cameraBusyRecording)
            {
                var msg = "Camera is already recording, can not start stream";
                if (resp) resp(msg);
                logger.error(msg);
                return;
            }

            if (resp) resp(null, "starting");

            if (!actormanagement.registeredActors["cam"].cameraBusyStreaming) {
                actormanagement.registeredActors["cam"].startStreaming(exports.socket);
            } else {
                actormanagement.registeredActors["cam"].sendImage();
            }
        }
        else
        {
            logger.info("Received stream stop request");
            actormanagement.registeredActors["cam"].stopStreaming();
            if (resp) resp(null, "stopping");
        }
    });

    exports.socket.on('start-video', function(msg, cb)
    {
        logger.info("Received video recording request for " + msg.duration + "s");

        actormanagement.registeredActors["cam"].record(msg.duration, function(err, data)
        {
            cb(err, data);
        });
    });

    exports.socket.on('maintenance', function(msg, cb)
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
        else if (msg.mode === "clearlogs")
        {
            logger.info("clearing logs!");

            fs.truncate(config.logFile, 0, function(err)
            {
                if (err)
                {
                    logger.error("could not delete logfile", err);
                }

                cb();
            });
        }
        else if (msg.mode === "log")
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
        else if (msg.mode === "updatechanges")
        {
            logger.info("Executing update changes");

            exec("../update", function(err, stdout, stderr)
            {
                stdout = stdout.toString();
                stderr = stderr.toString();

                if (err)
                {
                    return cb(stderr);
                }

                return cb(null, stdout);
            });
        }
        else if (msg.mode === "update")
        {
            logger.info("Executing update");

            exec("../update --execute", function(err, stdout, stderr)
            {
                stdout = stdout.toString();
                stderr = stderr.toString();

                if (err)
                {
                    return cb(stderr);
                }

                return cb(null, stdout);
            });
        }
    });

    exports.socket.on('disconnect', function()
    {
        logger.info(`disconnected from ${exports.serverUrl}`);
        if (actormanagement.has("cam")) actormanagement.registeredActors["cam"].stopStreaming();

        //if we receive a real "disconnect" event, the reconnection is not automatically being established again
        setTimeout(function()
        {
            logger.info(`establishing reconnection`);
            start.start();
        }, 2000);
    });  
};
