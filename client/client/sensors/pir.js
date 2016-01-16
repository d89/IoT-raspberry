var logger = require('../logger');

exports.watch = function(ondata, onclose, options)
{
    logger.info("watching PIR");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/pir',  [ options.port ]);
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

        //logger.info(`received temperature ${data.temperature}°C`);
        //logger.info(`received humidity ${data.humidity}°C`);
    });

    prc.on('close', function (code)
    {
        //logger.info('sensor reader exited with ' + code);

        onclose('pir sensor reader exited with ' + code);
    });
};

/*
exports.watch(function(succ, err)
{
   logger.info(succ, err);
});
*/