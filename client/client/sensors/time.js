"use strict";

var baseSensor = require("./baseSensor");
var moment = require("moment");

// ######################################################

class time extends baseSensor
{
    constructor(options)
    {
        super("time", options);

        var that = this;

        setInterval(function()
        {
            that.read();
        }, 1000);
    }

    exposed(val)
    {
        var exposedParent = super.exposed();
        var that = this;

        exposedParent.minutes = function(val)
        {
            if (!that.sensordata.is.length) return false;

            var minutes = that.sensordata.is.substr(2, 2);

            console.log("matching minutes " + minutes + " against " + val);

            var triggered = (minutes == val);
            return that.processCondition(triggered);
        };

        exposedParent.seconds = function(val)
        {
            if (!that.sensordata.is.length) return false;

            var seconds = that.sensordata.is.substr(4, 2);

            console.log("matching seconds " + seconds + " against " + val);

            var triggered = (seconds == val);
            return that.processCondition(triggered);
        };

        return exposedParent;
    }

    read()
    {
        var currTime = moment().format("HHmmss");
        this.senddata(currTime, this);
    }
}

module.exports = time;