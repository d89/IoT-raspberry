var spawn = require('child_process').spawn;
var logger = require('./logger');
var processMap = {};
const RESTART_THROTTLE_TIME = 5000; //prevent process spinning

exports.processKey = function(path, params)
{
    return path + "-" + params.join("-");
};

exports.registerRestart = function(processKey, killTimeInSeconds)
{
    logger.info("registering restart after " + killTimeInSeconds + "s for " + processKey);

    if (processMap[processKey].interval)
    {
        clearInterval(processMap[processKey].interval);
    }

    processMap[processKey].interval = setInterval(function()
    {
        var durationSinceLastInfo = ((new Date).getTime() - processMap[processKey].lastInfo) / 1000;

        if (durationSinceLastInfo > killTimeInSeconds)
        {
            logger.error("last response from sensor " + processKey + " was " + durationSinceLastInfo + "s ago - killing");
            processMap[processKey].process.kill();
            clearInterval(processMap[processKey].interval);
        }
    }, 3000);
};

exports.bindCallbacks = function(processKey)
{
    processMap[processKey].process.stdout.on("data", function(data)
    {
        //refresh last update time
        processMap[processKey].lastInfo = (new Date).getTime();

        for (var key in processMap[processKey].onOutput)
        {
            var cb = processMap[processKey].onOutput[key];
            cb(data);
        }
    });

    processMap[processKey].process.stderr.on("data", function(data)
    {
        for (var key in processMap[processKey].onError)
        {
            var cb = processMap[processKey].onError[key];
            cb(data);
        }
    });

    processMap[processKey].process.on("close", function(data)
    {
        logger.error("process " + processKey + " closed listener (1)");

        for (var key in processMap[processKey].onClose)
        {
            var cb = processMap[processKey].onClose[key];
            cb(data);
        }
    });
};

exports.restart = function(path, params)
{
    var processKey = exports.processKey(path, params);

    if (!(processKey in processMap))
    {
        return logger.error("process " + processKey + " is not known - cannot restart");
    }

    logger.error("restarting process " + processKey + " (3)");
    //processMap[processKey].lastRestart = (new Date).getTime();
    var restartCount = processMap[processKey].restartCount;
    var lastRestartBefore = (new Date().getTime() - processMap[processKey].lastRestart) / 1000;
    logger.error("restart #" + restartCount + " was " + lastRestartBefore + "s ago (4)");

    processMap[processKey].process = spawn(path, params);
    processMap[processKey].lastInfo = (new Date).getTime();
    processMap[processKey].lastRestart = (new Date).getTime();
    processMap[processKey].restartCount++;
    processMap[processKey].process.stdout.setEncoding('utf8');

    exports.bindCallbacks(processKey);

    if (processMap[processKey].restartSensorAfter)
    {
        exports.registerRestart(processKey, processMap[processKey].restartSensorAfter);
    }

    logger.error("restart done (5)");
    logger.error("-------------------------------------");
};

exports.spawn = function(path, params, restartSensorAfter, ondata, onerror, onclose)
{
    var processKey = exports.processKey(path, params);

    if (!onclose) onclose = function() {
        logger.error("closed process callback " + processKey + " (2)");

        setTimeout(function() {
            exports.restart(path, params);
        }, RESTART_THROTTLE_TIME);
    };

    if (!ondata) ondata = function(data) {
        logger.info(processKey + ": ", data.toString());
    };

    if (!onerror) onerror = function(data) {
        logger.error(processKey + ": ", data.toString());
    };

    //just adding callbacks for a running process
    if (processKey in processMap)
    {
        logger.info("process " + processKey + " already started, adding callbacks");

        //add event handlers if exactly this process is already known
        var randomKey = (new Date).getTime();

        if (ondata) processMap[processKey].onOutput[randomKey] = ondata;
        if (onerror) processMap[processKey].onError[randomKey] = onerror;
        //only one restartscript: if (onclose) processMap[processKey].onClose[randomKey] = onclose;

        return processMap[processKey];
    }

    //start a new process
    processMap[processKey] =
    {
        process: spawn(path, params || []),
        onOutput: {},
        onError: {},
        onClose: {},
        restartSensorAfter: restartSensorAfter,
        lastInfo: (new Date).getTime(),
        lastRestart: 0,
        restartCount: 0
    };

    processMap[processKey].process.stdout.setEncoding('utf8');

    if (ondata) processMap[processKey].onOutput['defaultOnData'] = ondata;
    if (onerror) processMap[processKey].onError['defaultOnError'] = onerror;
    if (onclose) processMap[processKey].onClose['defaultOnClose'] = onclose;

    //attach all callbacks from onOutput, onError and onClose to process
    exports.bindCallbacks(processKey);

    //after inactivity: restart
    if (processMap[processKey].restartSensorAfter)
    {
        exports.registerRestart(processKey, processMap[processKey].restartSensorAfter);
    }

    return processMap[processKey];
};
