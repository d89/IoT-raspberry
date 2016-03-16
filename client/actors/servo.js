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

    setServo(state, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        if (that.process)
        {
            that.logger.info("disabling servo");
            that.process.kill();
            that.process = null;
        }

        if (state === false)
        {
            return cb(null, "stopped servo");
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

        cb(null, "started servo");
    }

    on(cb)
    {
        this.setServo(true, cb);
    }

    off(cb)
    {
        this.setServo(false, cb);
    }
}

module.exports = servo;