var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching DHT11");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/dht11',  []);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("dht11 received err: ", data.toString());
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
        onclose('dht11 sensor reader exited with ' + code);
    });
};