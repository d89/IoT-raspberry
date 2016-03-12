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
            stop: {
                method: this.stop.bind(this),
                params: []
            }
        };
    }

    stop()
    {
        this.logger.info("stopping music");
        actormanagement.registeredActors["ledstrip"].allOff();
        soundmanager.stop();
    }

    play(title)
    {
        this.logger.info("playing music " + title);

        title = title || "siren.mp3";
        title = title.replace("..", "");
        title = config.mediaBasePath + "/" + title;

        if (!fs.existsSync(title))
        {
            this.logger.error("file " + title + " does not exist");
            return "file does not exist";
        }

        this.stop();

        soundmanager.play(title);
    }
}

module.exports = music;