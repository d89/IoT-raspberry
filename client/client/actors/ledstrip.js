"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var fs = require('fs');
var soundmanager = require('../soundmanager');
var LPD8806 = require('lpd8806');
var LED_COUNT = config.ledStripLedCount;

// ######################################################

class ledstrip extends baseActor
{
    constructor(options)
    {
        super("ledstrip", options);

        this.spawned = null;
        this.lightshowStarter = config.baseBath + '/actors/startlightshow';
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

    allOff()
    {
        var that = this;
        that.logger.info("disabling ledstrip");

        if (that.spawned)
        {
            try
            {
                if (that.spawned.type === "colorparty")
                {
                    that.logger.info("killing colorparty");
                    that.spawned.process.kill();
                }
                else if (that.spawned.type === "lightshow")
                {
                    that.logger.info("killing lightshow");

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
                    }
                    else
                    {
                        that.logger.error("No pid known of lightshow to be stopped");
                    }

                    that.logger.info("killed led strip group!");
                }
                else
                {
                    that.logger.error("nothing to kill!");
                }
            }
            catch (err)
            {
                that.logger.error("could not kill process", err);
            }

            that.spawned = null;
        }

        //music would interfere with the lightshow aswell
        soundmanager.stop();

        that.singleColor(0, 0, 0, true);
    }

    colorParty()
    {
        var that = this;
        that.allOff();
        that.logger.info("enabling color party");

        that.spawned = {
            process: spawn(config.baseBath + '/actors/ledstrip', [LED_COUNT]),
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
    }

    randomColor()
    {
        var randomColor = function()
        {
            var min = 0;
            var max = 255;
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        this.singleColor(randomColor(), randomColor(), randomColor());
    }

    synchronize()
    {
        this.allOff();
        
        var that = this;
        var ledLibLocation = config.baseBath + '/actors/ledstripdriver';
        var volume = config.volume;
        var params = ["line-in", ledLibLocation, config.soundCardInput, LED_COUNT];

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
    }

    lightshow(title)
    {
        var that = this;
        
        title = title || "song.mp3";
        title = title.replace("..", "");
        title = config.mediaBasePath + "/" + title;

        if (!fs.existsSync(title))
        {
            that.logger.error("file does not exist");
            return "file does not exist";
        }

        that.allOff();

        var ledLibLocation = config.baseBath + '/actors/ledstripdriver';
        var params = ["start-music", ledLibLocation, title, LED_COUNT];

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
    }

    singleColor(red, green, blue, skipReset)
    {
        if (!skipReset)
            this.allOff();

        this.logger.info("setting led color to " + red + " / " + green + " / " + blue);

        red = parseInt(red, 10);
        green = parseInt(green, 10);
        blue = parseInt(blue, 10);

        if (isNaN(red)) red = 255;
        if (isNaN(green)) green = 0;
        if (isNaN(blue)) blue = 255;

        var ledband = new LPD8806(LED_COUNT, '/dev/spidev0.0');
        ledband.fillRGB(red, blue, green);
    }
}

module.exports = ledstrip;