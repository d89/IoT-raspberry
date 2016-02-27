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

        var functions =
        {
            hours: {
                from: 0,
                length: 2
            },
            minutes: {
                from: 2,
                length: 2
            },
            seconds: {
                from: 4,
                length: 2
            }
        };

        for (var unit in functions)
        {
            (function(unit)
            {
                exposedParent[unit + "_is_equal"] =
                {
                    method: function(val)
                    {
                        if (!that.sensordata.is || that.sensordata.is.length === null) return false;
                        var readValue = that.sensordata.is.substr(functions[unit].from, functions[unit].length);
                        var triggered = (readValue == val);
                        return that.processCondition(unit + "_is_equal", val, triggered);
                    },
                    setResult: function()
                    {
                        that.setResult(unit + "_is_equal");
                    },
                    params: [{
                        name: "val",
                        isOptional: false,
                        dataType: "integer",
                        notes: "The current value of the sensor"
                    }]
                };

                exposedParent[unit + "_is_gt"] =
                {
                    method: function(val)
                    {
                        if (!that.sensordata.is || that.sensordata.is.length === null) return false;
                        var readValue = that.sensordata.is.substr(functions[unit].from, functions[unit].length);
                        var triggered = (readValue > val);
                        return that.processCondition(unit + "_is_gt", val, triggered);
                    },
                    setResult: function()
                    {
                        that.setResult(unit + "_is_gt");
                    },
                    params: [{
                        name: "val",
                        isOptional: false,
                        dataType: "integer",
                        notes: "The current value of the sensor"
                    }]
                };
            }(unit));
        }

        delete exposedParent["is_lt"];

        return exposedParent;
    }

    read()
    {
        var currTime = moment().format("HHmmss");
        this.senddata(currTime, this);
    }
}

module.exports = time;