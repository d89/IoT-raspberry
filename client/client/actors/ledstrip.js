var logger = require('../logger');
var config = require('../config');
var spawn = require('child_process').spawn;
var LPD8806 = require('lpd8806');
var LED_COUNT = 104; //TODO
var process = null;

exports.exposed = function()
{
    return {
        colorParty: {
            method: exports.colorParty,
            params: []
        },
        allOff: {
            method: exports.allOff,
            params: []
        },
        singleColor: {
            method: exports.singleColor,
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

exports.allOff = function()
{
    logger.info("disabling ledstrip");

    if (process)
    {
        process.kill();
        process = null;
    }

    exports.singleColor(0, 0, 0);
};

exports.colorParty = function()
{
    logger.info("activating led color party");

    if (process) return;

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
};

exports.singleColor = function(red, green, blue)
{
    if (process)
    {
        exports.allOff();
    }

    if (isNaN(red))
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
