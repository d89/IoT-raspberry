"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var spawn = require('child_process').spawn;

// ######################################################

class reachability extends baseSensor
{
    constructor(options)
    {
        super("reachability", "Smartphone Reachability", options);
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

        that.isReachable.apply(this, [that.options.ip, cb]);
    }

    // ----------------------------------------------

    isReachable(ip, cb)
    {
        var numberOfPackagesToSend = 3;
        var waitingTimePerPackage = 1;
        var ping = spawn("ping", ["-c", numberOfPackagesToSend, "-W", waitingTimePerPackage, ip]);

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

module.exports = reachability;