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

    stripNewLines(str)
    {
        return str.toString().replace(/(\r\n|\n|\r)/gm,"");
    }

    setStepper(state, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

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

        var params = pins;

        if (state === false)
        {
            params.push("off");
        }

        this.process = spawn(config.baseBath + '/actors/stepper', params);
        this.process.stdout.setEncoding('utf8');

        this.process.stderr.on('data', function(data)
        {
            that.logger.error("received err: ", that.stripNewLines(data));
        });

        this.process.stdout.on('data', function(data)
        {
            that.logger.info("received data: ", that.stripNewLines(data));
        });

        cb(null, state === false ? "stepper stopped" : "stepper started");
    }

    off(cb)
    {
        this.logger.info("disabling stepper");
        this.setStepper(false, cb);
    };

    on(cb)
    {
        this.logger.info("enabling stepper");
        this.setStepper(true, cb);
    }
}

module.exports = stepper;