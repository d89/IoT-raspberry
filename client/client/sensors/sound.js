var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching sound sensor");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/sound',  []);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("sound received err: ", data.toString());
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
        onclose('sound sensor reader exited with ' + code);
    });
};