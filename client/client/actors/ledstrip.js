var fs = require('fs');
var logger = require('../logger');
var config = require('../config');
var youtube = require('../youtube');
var spawn = require('child_process').spawn;
var LPD8806 = require('lpd8806');
var LED_COUNT = config.ledStripLedCount;
var spawned = null;

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
        randomColor: {
            method: exports.randomColor,
            params: []
        },
        lightshow: {
            method: exports.lightshow,
            params: [{
                name: "title",
                isOptional: false,
                dataType: "string",
                notes: "name of the song that should be played as lightshow"
            }]
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

    if (spawned && spawned.pid)
    {
        logger.info("killing pid group", spawned.pid);
        //kill subprocesses aswell
        try
        {
            process.kill(-spawned.pid);
        }
        catch (err)
        {
            logger.error("could not kill process", err);
        }

        spawned = null;
    }

    exports.singleColor(0, 0, 0, true);
};

exports.colorParty = function()
{
    exports.allOff();

    logger.info("enabling color party");

    spawned = spawn(config.baseBath + '/actors/ledstrip', [LED_COUNT], {detached: true});
    spawned.stdout.setEncoding('utf8');

    spawned.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    spawned.stdout.on('data', function (data)
    {
        logger.info("received data: ", data);
    });
};

exports.randomColor = function()
{
    var randomColor = function()
    {
        var min = 0;
        var max = 255;
        return Math.floor(Math.random()*(max-min+1)+min);
    };

    exports.singleColor(randomColor(), randomColor(), randomColor());
};

exports.lightshow = function(title)
{
    title = title || "song.mp3";
    title = title.replace("..", "");
    title = config.mediaBasePath + "/" + title;

    if (!fs.existsSync(title))
    {
        logger.error("file does not exist");
        return "file does not exist";
    }

    exports.allOff();

    var ledLibLocation = config.baseBath + '/actors/ledstripdriver';
    var lightshowStarter = config.baseBath + '/actors/lightshow';

    logger.info("starting " + lightshowStarter + " with file " + title + " and " + LED_COUNT + " leds, led base lib: " + ledLibLocation);

    spawned = spawn(lightshowStarter, [ledLibLocation, title, LED_COUNT], {detached: true});
    spawned.stdout.setEncoding('utf8');

    spawned.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    spawned.stdout.on('data', function (data)
    {
        //console.log(data.toString());
    });

    spawned.on("close", function(returnCode)
    {
        logger.info("lightshow finished with " + returnCode);
    });
};

exports.singleColor = function(red, green, blue, skipReset)
{
    if (!skipReset)
        exports.allOff();

    logger.info("setting led color to " + red + " / " + green + " / " + blue);

    red = parseInt(red, 10);
    green = parseInt(green, 10);
    blue = parseInt(blue, 10);

    if (isNaN(red)) red = 255;
    if (isNaN(green)) green = 0;
    if (isNaN(blue)) blue = 255;

    var ledband = new LPD8806(LED_COUNT, '/dev/spidev0.0');
    ledband.fillRGB(red, blue, green);
};
