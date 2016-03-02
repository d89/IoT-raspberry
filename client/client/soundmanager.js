var spawn = require('child_process').spawn;
var logger = require('./logger');
var config = require('./config');

exports.stop = function()
{
    logger.info("stopping music");

    spawn("pkill", ["-9", "omxplayer"]);
};

exports.play = function(title)
{
    exports.stop();

    logger.info("playing " + title + " with volume " + config.volume);
    var executable = "/usr/bin/omxplayer";
    spawn(executable, ["--vol", config.volume, title]);
};