var logger = require('../logger');
var process = null;
var spawn = require('child_process').spawn;
var config = require('../config');

exports.exposed = function()
{
    return {
        act: {
            method: exports.act,
            params: [{
                name: "onoff",
                isOptional: false,
                dataType: "boolean",
                notes: "turn on (true) or turn off (false)"
            }]
        }
    };
};

exports.act = function(onoff)
{
    //convert input values. Accept true / false, 0 / 1 and "0" / "1"
    if (typeof onoff != "boolean")
    {
        onoff = !!parseInt(onoff, 10);
    }

    logger.info("changing servo to state ", onoff);

    if (onoff && !process)
    {
        logger.info("enabling servo");

        process = spawn(config.baseBath + '/actors/servo',  []);
        process.stdout.setEncoding('utf8');

        process.stderr.on('data', function (data)
        {
            logger.error("received err: ", data.toString());
        });

        process.stdout.on('data', function (data)
        {
            logger.info("received data: ", data);
        });
    }

    if (!onoff && process)
    {
        logger.info("disabling servo");
        process.kill();
        process = null;
    }
};