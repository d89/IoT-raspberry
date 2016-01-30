var logger = require('../logger');

exports.transformLightValue = function(lightValue)
{
    //value is always between ~oldMaxLight (super light) and 255 (complete darkness)
    var oldMaxLight = 170;

    //value is now between
    // 0 -> super light
    // (255 - oldMaxLight) -> complete darkness
    lightValue = lightValue - oldMaxLight;

    //no negative numbers in case of "too light"
    if (lightValue < 0)
    {
        lightValue = 0;
    }

    //invert:
    //value is now between
    // (255 - oldMaxLight) -> complete darkness
    // 255 -> super light
    lightValue = 255 - lightValue;

    lightValue = lightValue - oldMaxLight;

    lightValue = 100 * (lightValue / (255 - oldMaxLight));

    return lightValue;
};

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

            //logger.info("light value before: " + data.light);

            data.light = exports.transformLightValue(parseFloat(data.light, 10));

            //logger.info("light value after: " + data.light);
            //logger.info("---------------------------------------------------");

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