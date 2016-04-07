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

    if (config.apitoken) //optional
        connectionParams.push("apitoken=" + crypto.createHash('sha512').update(config.apitoken).digest('hex'));

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

    exports.socket.on('execute-actor', function(msg, resp)
    {
        if (!("actor" in msg) || !("method" in msg) || !("params" in msg))
        {
            return resp("malformatted actionrequest");
        }

        var actor = msg.actor;
        var method = msg.method;
        var params = msg.params;

        actormanagement.executeByName(actor, method, params, resp);
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

    exports.socket.on('scenario', function(msg, cb)
    {
        logger.info("Received scenario request");

        if (!actormanagement.has("scenario"))
        {
            return cb("Please enable the actor 'scenario' first.");
        }

        if (!("type" in msg))
        {
            return cb("type missing");
        }

        if (msg.type === "save")
        {
            var data = msg.data || [];
            var name = msg.name;

            actormanagement.registeredActors["scenario"].save(data, name, function(err, data)
            {
                cb(err, data);
            });
        }
        else if (msg.type === "load")
        {
            actormanagement.registeredActors["scenario"].loadScenarios(function(data)
            {
                cb(null, data);
            });
        }
        else if (msg.type === "delete")
        {
            actormanagement.registeredActors["scenario"].deleteScenario(msg.name, function(err, data)
            {
                cb(err, data);
            });
        }
        else
        {
            return cb("invalid action.");
        }
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

            var out = fs.openSync('/tmp/update.log', 'a');
            var err = fs.openSync('/tmp/update.log', 'a');
            var child = spawn('../update', ["--execute"], { detached: true, stdio: [ 'ignore', out, err ] });
            child.unref();
        }
        else if (msg.mode === "updatelog")
        {
            var updateLogFile = "/tmp/update.log";

            if (!fs.existsSync(updateLogFile))
            {
                return cb("no update log available, seems like you have not updated yet or the file " + updateLogFile + " got lost?");
            }

            return cb(null, fs.readFileSync(updateLogFile).toString());
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
