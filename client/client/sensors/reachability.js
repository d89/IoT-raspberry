"use strict";

var baseSensor = require("./baseSensor");
var logger = require("../logger");
var config = require("../config");
var spawn = require('child_process').spawn;
const INTERVAL = 5000;

// ######################################################

class reachability extends baseSensor
{
    constructor(options)
    {
        super("reachability", options);
        this.read();
    }

    read()
    {
        var that = this;

        this.isReachable(function(err, isReachable)
        {
            if (!err)
            {
                that.senddata(isReachable ? 1 : 0, that);
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

    isReachable(cb)
    {
        var numberOfPackagesToSend = 3;
        var waitingTimePerPackage = 1;

        var ping = spawn("ping", ["-c", numberOfPackagesToSend, "-W", waitingTimePerPackage, this.options.ip]);

        ping.on("close", function(returnCode)
        {
            //console.log("ping response", returnCode);

            //returncode is 0 if one of the packages is successfull       {
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