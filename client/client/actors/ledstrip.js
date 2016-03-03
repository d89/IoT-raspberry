var fs = require('fs');
var logger = require('../logger');
var config = require('../config');
var soundmanager = require('../soundmanager');
var spawn = require('child_process').spawn;
var LPD8806 = require('lpd8806');
var LED_COUNT = config.ledStripLedCount;

exports.spawned = null;

exports.lightshowStarter = config.baseBath + '/actors/startlightshow';

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

    if (exports.spawned)
    {
        try
        {
            if (exports.spawned.type === "colorparty")
            {
                logger.info("killing colorparty");
                exports.spawned.process.kill();
            }
            else if (exports.spawned.type === "lightshow")
            {
                logger.info("killing lightshow");
                var params = ["stop", exports.spawned.process.pid];
                var killer = spawn(exports.lightshowStarter, params);

                killer.stderr.on('data', function (data)
                {
                    logger.error("received killer err: ", data.toString());
                });

                killer.stdout.on('data', function (data)
                {
                    logger.info("received killer data: ", data.toString());
                });

                logger.info("killed led strip group!");
            }
            else
            {
                logger.error("nothing to kill!");
            }
        }
        catch (err)
        {
            logger.error("could not kill process", err);
        }

        exports.spawned = null;
    }

    //music would interfere with the lightshow aswell
    soundmanager.stop();

    exports.singleColor(0, 0, 0, true);
};

exports.colorParty = function()
{
    exports.allOff();

    logger.info("enabling color party");

    exports.spawned = {
        process: spawn(config.baseBath + '/actors/ledstrip', [LED_COUNT]),
        type: "colorparty"
    };

    exports.spawned.process.stdout.setEncoding('utf8');

    exports.spawned.process.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    exports.spawned.process.stdout.on('data', function (data)
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
    var volume = config.volume;
    var params = ["start", ledLibLocation, title, LED_COUNT, volume];

    logger.info("calling " + exports.lightshowStarter + " " + params.join(" "));

    exports.spawned = {
        process: spawn(exports.lightshowStarter, params, { detached: true }),
        type: "lightshow"
    };

    exports.spawned.process.stdout.setEncoding('utf8');

    exports.spawned.process.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    exports.spawned.process.stdout.on('data', function (data)
    {
        //console.log(data.toString());
    });

    exports.spawned.process.on("close", function(returnCode)
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
