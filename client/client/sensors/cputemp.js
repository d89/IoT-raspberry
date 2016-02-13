"use strict";

var fs = require("fs");
var baseSensor = require("./baseSensor");
const INTERVAL = 5000;

// ######################################################

class cputemp extends baseSensor
{
    constructor(options)
    {
        super("cputemp", options);
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
        return fs.readFile("/sys/class/thermal/thermal_zone0/temp", function(err, data)
        {
            if (err)
                return cb(err);

            data = parseFloat(data, 10) / 1000;

            return cb(null, data);
        });
    }
}

module.exports = cputemp;