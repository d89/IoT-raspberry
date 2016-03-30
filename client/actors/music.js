"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var soundmanager = require('../soundmanager');
var actormanagement = require('../actormanagement');
var fs = require('fs');
var spawn = require('child_process').spawn;

// ######################################################

class music extends baseActor
{
    constructor(options)
    {
        super("music", options);
    }

    exposed()
    {
        return {
            play: {
                method: this.play.bind(this),
                params: [{
                    name: "title",
                    isOptional: true,
                    dataType: "string",
                    notes: "filename of .mp3 file to be played"
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
            title = title.replace("..", "");
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