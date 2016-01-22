var fs = require("fs");
var logger = require('../logger');
var spawn = require("child_process").spawn;
var os = require("os");
const INTERVAL = 5000;

var readMem = function(cb)
{
    var prc = spawn("free", []);

    prc.stdout.setEncoding("utf8");

    prc.stdout.on("data", function (data)
    {
        var lines = data.toString().split(/\n/g),
            line = lines[1].split(/\s+/),
            total = parseInt(line[1], 10),
            free = parseInt(line[3], 10),
            buffers = parseInt(line[5], 10),
            cached = parseInt(line[6], 10),
            actualFree = free + buffers + cached,
            memory = {
                total: total,
                used: parseInt(line[2], 10),
                free: free,
                shared: parseInt(line[4], 10),
                buffers: buffers,
                cached: cached,
                actualFree: actualFree,
                percentUsed: parseFloat(((1 - (actualFree / total)) * 100).toFixed(2)),
                comparePercentUsed: ((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2)
            };

        //logger.info("memory", memory);

        return cb(null, memory.percentUsed);
    });

    prc.on("error", function (error)
    {
        return cb(error);
    });
};

var sendMemLoop = function(ondata)
{
    readMem(function(err, temp)
    {
        if (!err)
            ondata(temp);

        setTimeout(function()
        {
            sendMemLoop(ondata);
        }, INTERVAL);
    });
};

exports.watch = function(ondata, onclose)
{
    logger.info("watching mem load");

    sendMemLoop(ondata);
};

/*
exports.watch(function(data)
{
    console.log(data);
});
*/