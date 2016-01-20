var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching hcsr04");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/hcsr04',  []);
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