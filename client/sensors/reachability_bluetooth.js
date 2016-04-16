"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var spawn = require('child_process').spawn;

// ######################################################

class reachability_bluetooth extends baseSensor
{
    constructor(options)
    {
        super("reachability_bluetooth", "Bluetooth Reachability", options);
        this.read();
    }

    read()
    {
        var that = this;
        var cb = function(err, isReachable)
        {
            if (!err)
            {
                var r = isReachable ? 1 : 0;
                that.senddata(r, that);
            }
            else
            {
                that.logger.error(err);
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        };

        that.isReachable.apply(this, [that.options.address, cb]);
    }

    // ----------------------------------------------

    isReachable(address, cb)
    {
        var numberOfPackagesToSend = 1;

        var ping = spawn("l2ping", ["-c", numberOfPackagesToSend, address]);

        ping.on("close", function(returnCode)
        {
            //console.log("ping response", returnCode);

            //returncode is 0 if one of the packages is successfull
            if (returnCode === 0 || returnCode === 1)
            {
                var wasSuccessfull = returnCode === 0;
                cb(null, wasSuccessfull);
            }
            else
            {
                cb("Received ping error: " + returnCode);
            }
        });
    }
}

module.exports = reachability_bluetooth;