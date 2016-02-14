var logger = require('../logger');

exports.exposed = function()
{
    return {
        act: exports.act
    };
};

exports.act = function(channel, device, state)
{
    logger.info(`switching rc plug: channel ${channel}, device ${device}, state ${state}`);
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/actors/switchrc', [channel, device, state]);
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

//exports.switch(1, 1, 0);