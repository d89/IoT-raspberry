var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching switch");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/switch',  []);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("switch received err: ", data.toString());
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
        onclose('switch sensor reader exited with ' + code);
    });
};