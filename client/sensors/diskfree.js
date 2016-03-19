"use strict";

var fs = require("fs");
var baseSensor = require("./baseSensor");
var exec = require("child_process").exec;

// ######################################################

class diskfree extends baseSensor
{
    constructor(options)
    {
        super("diskfree", "Free Disk (MB)", options);
        this.read();
    }

    read()
    {
        var that = this;

        this.readDisk(function(err, df)
        {
            if (!err)
            {
                that.senddata(df, that);
            }
            else
            {
                that.logger.error(err);
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }

    // ----------------------------------------------

    readDisk(cb)
    {
        var that = this;

        var child = exec("df / | awk '$3 ~ /[0-9]+/ { print $4 }'", function(error, stdout, stderr)
        {
            if (stderr)
                that.logger.error(stderr + "");

            if (error !== null)
            {
                return cb(error);
            }

            //in mb with precision 2
            var df = parseFloat((parseInt("" + stdout, 10) / 1024).toFixed(2), 10);

            return cb(null, df);
        });
    }
}

module.exports = diskfree;