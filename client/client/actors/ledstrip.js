var logger = require('../logger');
var config = require('../config');
var spawn = require('child_process').spawn;
var LPD8806 = require('lpd8806');
var LED_COUNT = 104; //TODO
var process = null;

exports.exposed = function()
{
    return {
        colorparty: {
            method: exports.colorparty,
            params: [{
                name: "onoff",
                isOptional: false,
                dataType: "boolean",
                notes: "turn on (true) or turn off (false)"
            }]
        },
        setColor: {
            method: exports.setColor,
            params: [{
                name: "red",
                isOptional: true,
                dataType: "integer",
                notes: "value between 0 and 255"
            },{
                name: "green",
                isOptional: true,
                dataType: "integer",
                notes: "value between 0 and 255"
            },{
                name: "blue",
                isOptional: true,
                dataType: "integer",
                notes: "value between 0 and 255"
            }]
        }
    };
};

exports.colorparty = function(onoff)
{
    //convert input values. Accept true / false, 0 / 1 and "0" / "1"
    if (typeof onoff != "boolean")
    {
        onoff = !!parseInt(onoff, 10);
    }

    logger.info("changing led party to state ", onoff);

    if (onoff && !process)
    {
        logger.info("enabling color party");

        process = spawn(config.baseBath + '/actors/ledstrip',  []);
        process.stdout.setEncoding('utf8');

        process.stderr.on('data', function (data)
        {
            logger.error("received err: ", data.toString());
        });

        process.stdout.on('data', function (data)
        {
            logger.info("received data: ", data);
        });
    }

    if (!onoff && process)
    {
        logger.info("disabling ledstrip");
        process.kill();
        process = null;
    }
};

exports.setColor = function(red, green, blue)
{
    if (typeof red === "string")
    {
        var colors = red.split(",");
        red = parseInt(colors[0], 10);
        green = parseInt(colors[1], 10);
        blue = parseInt(colors[2], 10);
    }
    logger.info("setting led color to " + red + " / " + green + " / " + blue);

    red = parseInt(red);
    green = parseInt(green);
    blue = parseInt(blue);

    if (isNaN(red)) red = 255;
    if (isNaN(green)) green = 0;
    if (isNaN(blue)) blue = 255;

    var ledband = new LPD8806(LED_COUNT, '/dev/spidev0.0');
    ledband.fillRGB(red, blue, green);
};
