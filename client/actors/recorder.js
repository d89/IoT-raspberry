"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var actormanagement = require('../actormanagement');
var sensormanagement = require('../sensormanagement');
var fs = require('fs');
var SOUND_CARD = config.soundCardInput;
const MAKE_LOUDER = 12; //make the recording X times louder

// ######################################################

class recorder extends baseActor
{
    constructor(options)
    {
        super("recorder", options);

        this.process = null;

        this.volume(config.volumemicrophone);
    }

    exposed()
    {
        return {
            record: {
                method: this.record.bind(this),
                params: [{
                    name: "title",
                    isOptional: true,
                    dataType: "string",
                    notes: "filename of recorded audio without extension. If you don't put a file name, a random one will be chosen."
                }, {
                    name: "length",
                    isOptional: true,
                    dataType: "integer",
                    notes: "recording duration in seconds, defaults to 5"
                }]
            },
            volume: {
                method: this.volume.bind(this),
                params: [{
                    name: "volume",
                    isOptional: false,
                    dataType: "integer",
                    notes: "Recorder volume between 0 (silent) and 100 (loudest)."
                }]
            },
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
        this.logger.info("setting recorder volume to ", volume);

        //unmute mic and set default: https://wiki.ubuntuusers.de/amixer/
        exec("amixer -c " + config.soundCardInput + " sset Mic,0 " + volume + "% unmute cap");
        config.volumemicrophone = volume;

        cb(null, "Recorder volume successfully adjusted");
    }

    receiveLine(str)
    {
        return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
    }

    stop(cb)
    {
        this.logger.info("stopping recording");

        if (this.process)
        {
            clearTimeout(this.process.killer);
            this.process.process.kill();
        }
        else
        {
            this.logger.info("No recording in progress that could be stopped");
        }

        //sound sync requires the microphone, so shut it down
        actormanagement.has("ledstrip") && actormanagement.registeredActors["ledstrip"].allOff();

        this.process = null;
    }

    convert(title, cb)
    {
        var that = this;
        
        cb = cb || function(err, info) { that.logger.info("no audio callack - values", err, info); };

        if (!fs.existsSync(title))
        {
            var text = "file " + title + " does not exist, cannot convert";
            cb(text);
            return that.logger.error(text);
        }

        var targetFileName = title + ".mp3";
        that.logger.info("converting " + title + " to mp3: " + targetFileName);
        var conv = spawn("ffmpeg", ["-y", "-i", title, "-af", "volume=" + MAKE_LOUDER, targetFileName]);

        conv.stdout.on("data", function(data)
        {
            that.logger.info("conv output: ", that.receiveLine(data.toString()));
        });

        conv.stderr.on("data", function(data)
        {
            //likes putting out stuff on stderr that is not an error
            that.logger.info("conv data: ", that.receiveLine(data.toString()));
        });

        conv.on("close", function(exitCode)
        {
            if (exitCode !== 0 || !fs.existsSync(targetFileName))
            {
                var text = "conversion error with code " + exitCode + " for file " + title;
                cb(text);
                that.logger.error(text);
            }
            else
            {
                fs.unlinkSync(title);
                that.logger.info("conversion success for file: " + targetFileName);
                cb(null, targetFileName);
            }
        });
    }

    record(title, maxLength, cb)
    {
        this.doRecord(title, maxLength, false, cb);
    }

    doRecord(title, maxLength, basePath, cb)
    {
        var that = this;

        var act = function()
        {
            title = title || "recording-" + (new Date).getTime() + ".wav";
            title = title.toString().replace("..", "");
            basePath = basePath || config.mediaBasePath;
            title = basePath + "/" + title;
            maxLength = parseInt(maxLength, 10);

            if (!isNaN(maxLength) && maxLength > 0) {
                maxLength *= 1000;
            } else {
                maxLength = 5000;
            }

            that.stop();
            that.logger.info("recording " + title + " with maxLength " + maxLength);
            var executable = "/usr/bin/arecord";

            //arecord -f cd -D plughw:1 a.wav
            that.process = {
                process: spawn(executable, ["-f", "cd", "-D", "plughw:" + SOUND_CARD, title]),
                killer: setTimeout(function()
                {
                    that.logger.info("max time timeout stop: " + maxLength);
                    that.stop();
                }, maxLength),
                title: title
            };

            that.process.process.stdout.on("data", function(data)
            {
                that.logger.info("recorder output: ", that.receiveLine(data.toString()));
            });

            that.process.process.stderr.on("data", function(data)
            {
                //likes putting out stuff on stderr that is not an error
                that.logger.info("recorder data: ", that.receiveLine(data.toString()));
            });

            that.process.process.on("close", function(exitCode)
            {
                //restart permanently listening voicerecognizer, if present
                if (sensormanagement.has("voicerecognizer"))
                {
                    sensormanagement.registeredSensors["voicerecognizer"].listenForHotword();
                }

                that.logger.info("recording " + title + " ended with " + exitCode);
                that.convert(title, cb);
            });
        };

        //stop permanently listening voicerecognizer, if present
        if (sensormanagement.has("voicerecognizer"))
        {
            that.logger.info("Stopping voicerecognizer");

            sensormanagement.registeredSensors["voicerecognizer"].killTTS(function()
            {
                act();
            });
        }
        else
        {
            act();
        }
    }
}

module.exports = recorder;