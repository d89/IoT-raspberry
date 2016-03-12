"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var process = null;

// ######################################################

class servo extends baseActor
{
    constructor(options)
    {
        super("servo", options);
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

    setServo(state)
    {
        var that = this;
        
        if (that.process)
        {
            that.logger.info("disabling servo");
            that.process.kill();
            that.process = null;
        }

        if (state === false)
        {
            return;
        }

        that.logger.info("enabling servo");
        that.process = spawn(config.baseBath + '/actors/servo', [that.options.pin]);
        that.process.stdout.setEncoding('utf8');

        that.process.stderr.on('data', function (data)
        {
            that.logger.error("received err: ", data.toString());
        });

        that.process.stdout.on('data', function (data)
        {
            that.logger.info("received data: ", data);
        });
    }

    on()
    {
        this.setServo(true);
    }

    off()
    {
        this.setServo(false);
    }
}

module.exports = servo;