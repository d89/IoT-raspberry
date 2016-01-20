var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching LM393");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/lm393',  []);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
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
        onclose('lm393 sensor reader exited with ' + code);
    });
};