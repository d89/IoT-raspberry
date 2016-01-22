var fs = require("fs");
var logger = require('../logger');
const INTERVAL = 5000;

var readLoad = function(cb)
{
    return fs.readFile("/proc/loadavg", function(err, content)
    {
        if (err)
            return cb(err);

        var content = content.toString().split(" ").splice(0, 3);

        //logger.info(content);

        var load = parseFloat(content[0], 10);

        return cb(null, load);
    });
};

var sendLoadLoop = function(ondata)
{
    readLoad(function(err, temp)
    {
        if (!err)
            ondata(temp);

        setTimeout(function()
        {
            sendLoadLoop(ondata);
        }, INTERVAL);
    });
}

exports.watch = function(ondata, onclose)
{
    logger.info("watching cpu load");

    sendLoadLoop(ondata);
};

/*
exports.watch(function(err, data)
{
    console.log(err, data);
});
*/