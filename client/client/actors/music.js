var logger = require('../logger');
var spawn = require('child_process').spawn;

exports.exposed = function()
{
    return {
        act: exports.act
    };
};

exports.act = function(title)
{
    //activated.mp3  deactivated.mp3  gong.mp3  light.mp3  siren.mp3  song.mp3
    title = title || "siren.mp3";
    title = "/home/pi/Music/" + title;

    spawn('/usr/bin/mpg321', [title]);
};