"use strict";

var fs = require("fs");
var baseSensor = require("./baseSensor");
const INTERVAL = 5000;

// ######################################################

class load extends baseSensor
{
    constructor(options)
    {
        super("load", options);
        this.read();
    }

    read()
    {
        var that = this;

        this.readLoad(function(err, temp)
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

    readLoad(cb)
    {
        return fs.readFile("/proc/loadavg", function(err, data)
        {
            if (err)
                return cb(err);

            data = data.toString().split(" ").splice(0, 3);
            data = parseFloat(data[0], 10);

            return cb(null, data);
        });
    }
}

module.exports = load;