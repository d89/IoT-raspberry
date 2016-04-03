"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var soundmanager = require('../soundmanager');
var actormanagement = require('../actormanagement');
var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

// ######################################################

class music extends baseActor
{
    constructor(options)
    {
        super("music", options);

        this.volume(config.volume);
    }

    exposed()
    {
        return {
            play: {
                method: this.play.bind(this),
                params: [{
                    name: "title",
                    isOptional: false,
                    dataType: "string",
                    notes: "filename of .mp3 file to be played"
                }]
            },
            volume: {
                method: this.volume.bind(this),
                params: [{
                    name: "volume",
                    isOptional: false,
                    dataType: "integer",
                    notes: "Sound volume between 0 (silent) and 100 (loudest)."
                }]
            },
            beep: {
                method: this.beep.bind(this),
                params: []
            },
            stop: {
                method: this.stop.bind(this),
                params: []
            }
        };
    }

    volume(volume, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("volume result", err, resp);
        };

        var volume = parseFloat(volume, 10);

        if (isNaN(volume) || volume < 0 || volume > 100)
        {
            return cb("invalid volume");
        }

        //Volume ranges from 0 to 100%
        this.logger.info("setting audio volume to ", volume);

        exec("amixer -c " + config.soundCardOutput + " sset PCM,0 " + volume + "%");

        config.volume = volume;

        cb(null, "Volume successfully adjusted");
    }

    stop(cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        this.logger.info("stopping music");
        actormanagement.has("ledstrip") && actormanagement.registeredActors["ledstrip"].allOff();
        soundmanager.stop();
        cb(null, "stopped music");
    }

    beep(cb, donePlaying)
    {
        this.play(false, cb, donePlaying);
    }

    play(title, cb, donePlaying)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        this.logger.info("playing music " + title);

        if (title)
        {
            title = title.toString().replace("..", "");
            title = config.mediaBasePath + "/" + title;
        }

        this.stop();

        soundmanager.play(title, function(err, msg)
        {
            if (donePlaying)
            {
                donePlaying(err, msg);
            }
        });

        cb(null, "starting music");
    }
}

module.exports = music;