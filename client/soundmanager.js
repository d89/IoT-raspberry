var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var logger = require('./logger');
var config = require('./config');

var SOUND_CARD = config.soundCardOutput;

exports.stop = function()
{
    logger.info("stopping music");

    spawn("pkill", ["-9", "mpg321"]);
    spawn("pkill", ["-9", "aplay"]);
};

exports.play = function(title, cb)
{
    cb = cb || function(err, msg)
    {
        if (err)
            logger.error("soundmanager", err);
        else
            logger.info("soundmanager", msg);
    };

    exports.stop();

    /*
    //problem of omxplayer: no usb soundcards supported
    var executable = "/usr/bin/omxplayer";
    spawn(executable, ["--vol", config.volume, title]);
    */

    var fileExists = title && fs.existsSync(title);
    var isWaveFile = fileExists && path.extname(title) === ".wav";

    var prc = null;

    if (!fileExists)
    {
        //play beep if file is not there
        logger.info("soundmanager beeping");
        return exec("timeout 0.1s speaker-test -D plughw:" + SOUND_CARD + " -t sine", cb);
    }

    logger.info("playing " + title + " with volume " + config.volume);

    if (isWaveFile)
    {
        prc = spawn("/usr/bin/aplay", [title]);
    }
    else
    {
        prc = spawn("/usr/bin/mpg321", ["-o", "alsa", "-a", "plughw:" + SOUND_CARD + ",0", title]);
    }

    prc.on("close", function(exitCode)
    {
        if (exitCode != 0)
        {
            cb("could not play sound " + title + ", exit code " + exitCode);
        }
        else
        {
            cb(null, "played sound " + title);
        }
    })
};