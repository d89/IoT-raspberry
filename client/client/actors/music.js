var logger = require('../logger');
var config = require('../config');
var ledstrip = require('./ledstrip');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var musicProcess = null;

exports.exposed = function()
{
    return {
        act: {
            method: exports.act,
            params: [{
                name: "title",
                isOptional: true,
                dataType: "string",
                notes: "filename of .mp3 file to be played"
            }]
        },
        stop: {
            method: exports.stop,
            params: []
        }
    };
};

exports.stop = function()
{
    logger.info("stopping music");

    if (musicProcess)
    {
        musicProcess.kill();
        logger.info("... playing music killed!");
    }
    else
    {
        logger.info("no music is running that could be stopped");
    }
};

exports.act = function(title)
{
    logger.info("playing music " + title);

    title = title || "siren.mp3";
    title = title.replace("..", "");
    title = config.mediaBasePath + "/" + title;

    if (!fs.existsSync(title))
    {
        logger.error("file " + title + " does not exist");
        return "file does not exist";
    }

    ledstrip.allOff();
    exports.stop();

    var extension = path.extname(title);
    var executable = extension === ".wav" ? "/usr/bin/aplay" : "/usr/bin/mpg321";
    musicProcess = spawn(executable, [title]);
};