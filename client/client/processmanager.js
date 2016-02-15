var spawn = require('child_process').spawn;
var logger = require('./logger');

var processMap = {};

exports.processKey = function(path, params)
{
    return path + "-" + params.join("-");
};

exports.registerRestart = function(processKey, killTimeInSeconds)
{
    //logger.info("registering restart after " + killTimeInSeconds + " for " + processKey);

    processMap[processKey].interval = setInterval(function()
    {
        var durationSinceLastInfo = ((new Date).getTime() - processMap[processKey].lastInfo) / 1000;

        if (durationSinceLastInfo > killTimeInSeconds)
        {
            logger.error("last response from sensor was " + durationSinceLastInfo + "s ago - killing");
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

        processMap[processKey].onOutput.forEach(function(o)
        {
            o(data);
        })
    });

    processMap[processKey].process.stderr.on("data", function(data)
    {
        processMap[processKey].onError.forEach(function(o)
        {
            o(data);
        })
    });

    processMap[processKey].process.on("close", function(data)
    {
        logger.error("process " + processKey + " is closed!");

        processMap[processKey].onClose.forEach(function(o)
        {
            o(data);
        })
    });
};

exports.restart = function(path, params)
{
    var processKey = exports.processKey(path, params);

    if (!(processKey in processMap))
    {
        return logger.error("process " + processKey + " is not known - cannot restart");
    }

    logger.error("restarting process " + processKey);

    processMap[processKey].process = spawn(path, params);
    processMap[processKey].lastInfo = (new Date).getTime();
    processMap[processKey].process.stdout.setEncoding('utf8');

    exports.bindCallbacks(processKey);

    if (processMap[processKey].restartAfter)
    {
        exports.registerRestart(processKey, processMap[processKey].restartAfter);
    }

    return processMap[processKey];
};

exports.spawn = function(path, params, restartAfter, ondata, onerror, onclose)
{
    var processKey = exports.processKey(path, params);

    if (!onclose)
    {
        onclose = function()
        {
            logger.error("closed process " + processKey);
            return exports.restart(path, params);
        };
    }

    if (processKey in processMap)
    {
        //add event handlers if exactly this process is already known
        ondata && processMap[processKey].onOutput.push(ondata);
        onerror && processMap[processKey].onError.push(onerror);
        onclose && processMap[processKey].onClose.push(onclose);

        return processMap[processKey];
    }

    processMap[processKey] =
    {
        process: spawn(path, params || []),
        onOutput: [],
        onError: [],
        onClose: [],
        restartAfter: restartAfter,
        lastInfo: (new Date).getTime()
    };

    processMap[processKey].process.stdout.setEncoding('utf8');

    ondata && processMap[processKey].onOutput.push(ondata);
    onerror && processMap[processKey].onError.push(onerror);
    onclose && processMap[processKey].onClose.push(onclose);

    exports.bindCallbacks(processKey);

    if (processMap[processKey].restartAfter)
    {
        exports.registerRestart(processKey, processMap[processKey].restartAfter);
    }

    return processMap[processKey];
};
