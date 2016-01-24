var logger = require('../logger');
var process = null;
var spawn = require('child_process').spawn;

exports.act = function(onoff)
{
    logger.info("changing servo to state ", onoff);

    if (onoff && !process)
    {
        process = spawn('/var/www/IoT-raspberry/actors/servo',  []);
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
        process.kill();
        process = null;
    }
};