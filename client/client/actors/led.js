"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;

// ######################################################

class led extends baseActor
{
    constructor(options)
    {
        super("led", options);
    }

    exposed()
    {
        return {
            red: {
                method: this.red.bind(this),
                params: []
            },
            green: {
                method: this.green.bind(this),
                params: []
            }
        };
    }

    red()
    {
        this.blink(this.options.pin_red);
    }

    green()
    {
        this.blink(this.options.pin_green);
    }

    blink(pin)
    {
        var that = this;
        that.logger.info("blinking LED PIN " + pin);

        var prc = spawn(config.baseBath + '/actors/led', [ pin ]);
        prc.stdout.setEncoding('utf8');

        prc.stderr.on('data', function (data)
        {
            that.logger.error("received err: ", data.toString());
        });

        prc.stdout.on('data', function (data)
        {
            that.logger.info("received data: ", data);
        });
    }
}

module.exports = led;