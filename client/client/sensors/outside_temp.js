"use strict";

var fs = require("fs");
var baseSensor = require("./baseSensor");
var exec = require("child_process").exec;
const INTERVAL = 5000;

// ######################################################

class outside_temp extends baseSensor
{
    constructor(options)
    {
        super("outside_temp", options);
        this.read();
    }

    read()
    {
        var that = this;

        this.readTemp(function(err, temp)
        {
            if (!err)
            {
                that.senddata(temp, that);
            }
            else
            {
                that.logger.error(err);
            }

            setTimeout(function()
            {
                that.read();
            }, INTERVAL);
        });
    }

    // ----------------------------------------------

    readTemp(cb)
    {
        var child = exec('grep "t=" /sys/bus/w1/devices/28-*/w1_slave', function(error, stdout, stderr)
        {
            if (stderr)
                logger.error(stderr + "");

            if (error !== null)
            {
                return cb(error);
            }

            stdout = (stdout + "");
            var onewire = stdout.split("t=");
            var temp = false;

            if (onewire && onewire.length === 2)
            {
                onewire = parseInt(onewire[1], 10);

                if (!isNaN(onewire))
                {
                    temp = onewire / 1000.0;
                }
            }

            if (temp === false)
            {
                var msg = "invalid 1wire temperature: " + stdout;
                return cb(msg);
            }

            return cb(null, temp);
        });
    }
}

module.exports = outside_temp;