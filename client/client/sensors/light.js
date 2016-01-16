var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching Light");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/light',  []);

    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.info("received err: ", data);
    });

    prc.stdout.on('data', function (data)
    {
        try
        {
            //logger.info("received: ", data);
            data = JSON.parse("" + data);

            ondata(data);
        }
        catch (err)
        {
            return;
        }
    });

    prc.on('close', function (code)
    {
        onclose('light sensor reader exited with ' + code);
    });
};

/*
exports.watch(function(succ, err)
{
 logger.info(succ, err);
});
*/