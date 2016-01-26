var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching hcsr04");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/hcsr04',  []);
    var lastInfo = (new Date).getTime();
    var killTimeInSeconds = 20;

    var interval = setInterval(function()
    {
        var durationSinceLastInfo = ((new Date).getTime() - lastInfo) / 1000;

        if (durationSinceLastInfo > killTimeInSeconds)
        {
            logger.error("last response from sensor was " + durationSinceLastInfo + "s ago - killing");
            prc.kill();
            clearInterval(interval);
        }
    }, 3000);

    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("hcsr04 received err: ", data.toString());
    });

    prc.stdout.on('data', function (data)
    {
        try
        {
            data = JSON.parse("" + data);
            lastInfo = (new Date).getTime();
            ondata(data);
        }
        catch (err)
        {
            return;
        }
    });

    prc.on('close', function (code)
    {
        onclose('hcsr04 sensor reader exited with ' + code);
    });
};