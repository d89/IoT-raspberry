"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var fs = require('fs');
var soundmanager = require('../soundmanager');
var actormanagement = require('../actormanagement');
var sensormanagement = require('../sensormanagement');
var LPD8806 = require('lpd8806');

// ######################################################

class ledstrip extends baseActor
{
    constructor(options)
    {
        super("ledstrip", options);

        this.spawned = null;
        this.lightshowStarter = config.baseBath + '/actors/startlightshow';
        this.ledCount = this.options.ledCount;
    }

    dependenciesFulfilled()
    {
        if (!actormanagement.has("music"))
            return "actor music is required";

        return true;
    }

    exposed()
    {
        return {
            colorParty: {
                method: this.colorParty.bind(this),
                params: []
            },
            allOff: {
                method: this.allOff.bind(this),
                params: []
            },
            randomColor: {
                method: this.randomColor.bind(this),
                params: []
            },
            synchronize: {
                method: this.synchronize.bind(this),
                params: []
            },
            lightshow: {
                method: this.lightshow.bind(this),
                params: [{
                    name: "title",
                    isOptional: false,
                    dataType: "string",
                    notes: "name of the song that should be played as lightshow"
                }]
            },
            singleColor: {
                method: this.singleColor.bind(this),
                params: [{
                    name: "red",
                    isOptional: true,
                    dataType: "integer",
                    notes: "value between 0 and 255"
                }, {
                    name: "green",
                    isOptional: true,
                    dataType: "integer",
                    notes: "value between 0 and 255"
                }, {
                    name: "blue",
                    isOptional: true,
                    dataType: "integer",
                    notes: "value between 0 and 255"
                }]
            }
        };
    }

    allOff(cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        that.logger.info("disabling ledstrip");
        var logtext = [];
        var isError = false;

        if (that.spawned)
        {
            try
            {
                if (that.spawned.type === "colorparty")
                {
                    logtext.push("killing colorparty");
                    that.spawned.process.kill();
                }
                else if (that.spawned.type === "lightshow")
                {
                    logtext.push("killing lightshow");

                    if (that.spawned.process.pid)
                    {
                        var params = ["stop", that.spawned.process.pid];
                        var killer = spawn(that.lightshowStarter, params);

                        killer.stderr.on('data', function(data)
                        {
                            that.logger.error("received killer err: ", data.toString());
                        });

                        killer.stdout.on('data', function(data)
                        {
                            that.logger.info("received killer data: ", data.toString());
                        });

                        logtext.push("killed lightshow");
                    }
                    else
                    {
                        logtext.push("No pid known of lightshow to be stopped");
                    }

                    that.logger.info("killed led strip group!");
                }
                else
                {
                    logtext.push("nothing to kill!");
                }
            }
            catch (err)
            {
                isError = true;
                logtext.push("could not kill process: " + err);
            }

            that.spawned = null;
        }
        else
        {
            logtext.push("no lightshow active");
        }

        //music would interfere with the lightshow aswell
        soundmanager.stop();

        that.setSingleColor(0, 0, 0, true);

        if (isError)
        {
            cb(logtext.join(", "));
        }
        else
        {
            cb(null, logtext.join(", "));
        }
    }

    colorParty(cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        that.allOff();
        that.logger.info("enabling color party");

        that.spawned = {
            process: spawn(config.baseBath + '/actors/ledstrip', [that.options.ledCount]),
            type: "colorparty"
        };

        that.spawned.process.stdout.setEncoding('utf8');

        that.spawned.process.stderr.on('data', function(data)
        {
            that.logger.error("received err: ", data.toString());
        });

        that.spawned.process.stdout.on('data', function(data)
        {
            that.logger.info("received data: ", data);
        });

        cb(null, "started color party");
    }

    randomColor(cb)
    {
        var rnd = function()
        {
            var min = 0;
            var max = 255;
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        this.setSingleColor(rnd(), rnd(), rnd(), false, cb);
    }

    synchronize(cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        this.allOff();

        var ledLibLocation = config.baseBath + '/actors/ledstripdriver';
        var volume = config.volume;
        var params = ["line-in", ledLibLocation, config.soundCardInput, that.options.ledCount];

        that.logger.info("calling " + that.lightshowStarter + " " + params.join(" "));

        var act = function()
        {
            that.spawned = {
                process: spawn(that.lightshowStarter, params, {detached: true}),
                type: "lightshow"
            };

            that.spawned.process.stdout.setEncoding('utf8');

            that.spawned.process.stderr.on('data', function(data)
            {
                that.logger.error("received err: ", data.toString());
            });

            that.spawned.process.stdout.on('data', function(data)
            {
                //console.log(data.toString());
            });

            that.spawned.process.on("close", function(returnCode)
            {
                that.logger.info("lightshow finished with " + returnCode);

                if (sensormanagement.has("voicerecognizer"))
                {
                    sensormanagement.registeredSensors["voicerecognizer"].listenForHotword();
                }
            });

            cb(null, "started synchronized lightshow");
        };

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

    lightshow(title, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };
        
        title = title || "song.mp3";
        title = title.toString();
        title = title.replace("..", "");
        title = config.mediaBasePath + "/" + title;

        if (!fs.existsSync(title))
        {
            return cb("file does not exist");
        }

        that.allOff();

        var ledLibLocation = config.baseBath + '/actors/ledstripdriver';
        var params = ["start-music", ledLibLocation, title, that.options.ledCount];

        that.logger.info("calling " + that.lightshowStarter + " " + params.join(" "));

        that.spawned = {
            process: spawn(that.lightshowStarter, params, {detached: true}),
            type: "lightshow"
        };

        that.spawned.process.stdout.setEncoding('utf8');

        that.spawned.process.stderr.on('data', function(data)
        {
            that.logger.error("received err: ", data.toString());
        });

        that.spawned.process.stdout.on('data', function(data)
        {
            //console.log(data.toString());
        });

        that.spawned.process.on("close", function(returnCode)
        {
            that.logger.info("lightshow finished with " + returnCode);
        });

        cb(null, "started lightshow for " + title);
    }

    setSingleColor(red, green, blue, skipReset, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        //if called from allOff, we don't want to cycle
        if (!skipReset)
            this.allOff();

        this.logger.info("setting led color to " + red + " / " + green + " / " + blue);

        red = parseInt(red, 10);
        green = parseInt(green, 10);
        blue = parseInt(blue, 10);

        if (isNaN(red)) red = 255;
        if (isNaN(green)) green = 0;
        if (isNaN(blue)) blue = 255;

        var ledband = new LPD8806(this.options.ledCount, '/dev/spidev0.0');
        ledband.fillRGB(red, blue, green);

        cb(null, "set ledstrip color");
    }

    singleColor(red, green, blue, cb)
    {
        this.setSingleColor(red, green, blue, false, cb)
    }
}

module.exports = ledstrip;