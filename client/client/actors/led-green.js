var logger = require('../logger');

exports.act = function()
{
    logger.info("blinking LED");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/actors/led-green',  []);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    prc.stdout.on('data', function (data)
    {
        logger.info("received data: ", data);
    });
};