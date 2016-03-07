var logger = require('../logger');
var config = require('../config');
var ledstrip = require('./ledstrip');
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');

var SOUND_CARD = config.soundCardInput;
const MAKE_LOUDER = 12; //make the recording 4 times louder

var receiveLine = function(str) {
    return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
};

exports.exposed = function()
{
    return {
        act: {
            method: exports.act,
            params: [{
                name: "title",
                isOptional: true,
                dataType: "string",
                notes: "filename of recorded audio without extension"
            },{
                name: "length",
                isOptional: true,
                dataType: "integer",
                notes: "recording duration in seconds"
            }]
        }
    };
};

exports.process = null;

exports.stop = function(cb)
{
    logger.info("stopping recording");

    if (exports.process)
    {
        clearTimeout(exports.process.killer);
        exports.process.process.kill();
    }
    else
    {
        logger.info("No recording in progress that could be stopped");
    }

    //sound sync requires the microphone, so shut it down
    ledstrip.allOff();

    exports.process = null;
};

exports.convert = function(title, cb)
{
    cb = cb || function(err, info) { logger.info("no audio callack - values", err, info); };

    if (!fs.existsSync(title))
    {
        var text = "file " + title + " does not exist, cannot convert";
        cb(text);
        return logger.error(text);
    }

    var targetFileName = title + ".mp3";

    logger.info("converting " + title + " to mp3: " + targetFileName);

    var conv = spawn("ffmpeg", ["-y", "-i", title, "-af", "volume=" + MAKE_LOUDER, targetFileName]);

    conv.stdout.on("data", function(data)
    {
        logger.info("conv output: ", receiveLine(data.toString()));
    });

    conv.stderr.on("data", function(data)
    {
        //likes putting out stuff on stderr that is not an error
        logger.info("conv data: ", receiveLine(data.toString()));
    });

    conv.on("close", function(exitCode)
    {
        if (exitCode !== 0 || !fs.existsSync(targetFileName))
        {
            var text = "conversion error with code " + exitCode + " for file " + title;
            cb(text);
            logger.error(text);
        }
        else
        {
            fs.unlinkSync(title);
            logger.info("conversion success for file: " + targetFileName);
            cb(null, targetFileName);
        }
    });
};

exports.act = function(title, maxLength, basePath, recordCb)
{
    title = title || "recording-" + (new Date).getTime() + ".wav";
    title = title.replace("..", "");
    basePath = basePath || config.mediaBasePath;
    title = basePath + "/" + title;

    maxLength = parseInt(maxLength, 10);

    if (!isNaN(maxLength) && maxLength > 0) {
        maxLength *= 1000;
    } else {
        maxLength = 5000;
    }

    exports.stop();

    logger.info("recording " + title + " with maxLength " + maxLength);

    var executable = "/usr/bin/arecord";

    //arecord -f cd -D plughw:1 a.wav
    exports.process = {
        process: spawn(executable, ["-f", "cd", "-D", "plughw:" + SOUND_CARD, title]),
        killer: setTimeout(function()
        {
            logger.info("max time timeout stop: " + maxLength);
            exports.stop();
        }, maxLength),
        title: title
    };

    exports.process.process.stdout.on("data", function(data)
    {
        logger.info("recorder output: ", receiveLine(data.toString()));
    });

    exports.process.process.stderr.on("data", function(data)
    {
        //likes putting out stuff on stderr that is not an error
        logger.info("recorder data: ", receiveLine(data.toString()));
    });

    exports.process.process.on("close", function(exitCode)
    {
        logger.info("recording " + title + " ended with " + exitCode);

        exports.convert(title, recordCb);
    });
};