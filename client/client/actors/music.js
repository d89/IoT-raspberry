var logger = require('../logger');
var config = require('../config');
var youtube = require('../youtube');
var spawn = require('child_process').spawn;
var fs = require('fs');
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
        logger.info("... killed!");
    }
    else
    {
        logger.info("no music is running that could be stopped");
    }
};

exports.act = function(title)
{
    title = title || "siren.mp3";
    title = title.replace("..", "");
    title = config.mediaBasePath + "/" + title;

    if (!fs.existsSync(title))
    {
        logger.error("file " + title + " does not exist");
        return "file does not exist";
    }

    exports.stop();

    musicProcess = spawn('/usr/bin/mpg321', [title]);
};