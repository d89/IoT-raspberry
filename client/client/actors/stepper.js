"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;

// ######################################################

class stepper extends baseActor
{
    constructor(options)
    {
        super("stepper", options);

        this.process = null;
    }

    exposed()
    {
        return {
            on: {
                method: this.on.bind(this),
                params: []
            },
            off: {
                method: this.off.bind(this),
                params: []
            }
        };
    }

    setStepper(state)
    {
        if (this.process)
        {
            this.process.kill();
            this.process = null;
        }

        var pins = [
            this.options.pin1,
            this.options.pin2,
            this.options.pin3,
            this.options.pin4
        ];

        var that = this;
        var params = pins;

        if (state === false)
        {
            params.push("off");
        }

        this.process = spawn(config.baseBath + '/actors/stepper', params);
        this.process.stdout.setEncoding('utf8');

        this.process.stderr.on('data', function(data)
        {
            that.logger.error("received err: ", data.toString());
        });

        this.process.stdout.on('data', function(data)
        {
            that.logger.info("received data: ", data);
        });
    }

    off()
    {
        this.logger.info("disabling stepper");
        this.setStepper(false);
    };

    on()
    {
        this.logger.info("enabling stepper");
        this.setStepper(true);
    }
}

module.exports = stepper;