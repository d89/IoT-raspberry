var logger = require('../logger');

exports.watch = function(ondata, onclose, options)
{
    logger.info("watching PIR");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/pir',  [ options.port ]);
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
        onclose('pir sensor reader exited with ' + code);
    });
};