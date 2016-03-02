var logger = require('../logger');
var config = require('../config');
var soundmanager = require('../soundmanager');
var ledstrip = require('./ledstrip');
var fs = require('fs');

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

    ledstrip.allOff();
    soundmanager.stop();
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

    exports.stop();

    soundmanager.play(title);
};