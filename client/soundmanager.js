var spawn = require('child_process').spawn;
var path = require('path');
var logger = require('./logger');
var config = require('./config');

var SOUND_CARD = config.soundCardOutput;

exports.stop = function()
{
    logger.info("stopping music");

    spawn("pkill", ["-9", "mpg321"]);
    spawn("pkill", ["-9", "aplay"]);
};

exports.play = function(title)
{
    exports.stop();

    logger.info("playing " + title + " with volume " + config.volume);

    /*
    //problem of omxplayer: no usb soundcards supported
    var executable = "/usr/bin/omxplayer";
    spawn(executable, ["--vol", config.volume, title]);
    */

    var isWaveFile = path.extname(title) === ".wav";

    if (isWaveFile)
    {
        spawn("/usr/bin/aplay", [title]);
    }
    else
    {
        spawn("/usr/bin/mpg321", ["-o", "alsa", "-a", "plughw:" + SOUND_CARD + ",0", title]);
    }
};