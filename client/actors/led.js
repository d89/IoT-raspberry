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

    red(cb)
    {
        this.blink(this.options.pin_red, cb);
    }

    green(cb)
    {
        this.blink(this.options.pin_green, cb);
    }

    blink(pin, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

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

        cb(null, "blink done");
    }
}

module.exports = led;