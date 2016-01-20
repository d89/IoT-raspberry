var logger = require('../logger');

exports.watch = function(ondata, onclose)
{
    logger.info("watching pcf8591");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/pcf8591',  []);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("pcf8591 received err: ", data.toString());
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
        onclose('pcf8591 sensor reader exited with ' + code);
    });
};

/*
exports.watch(function(data)
{
    console.log(data);
});
*/