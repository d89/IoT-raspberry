"use strict";

var baseSensor = require("./baseSensor");
var moment = require("moment");

// ######################################################

class time extends baseSensor
{
    constructor(options)
    {
        super("time", false, options);

        var that = this;

        setInterval(function()
        {
            that.read();
        }, that.options.interval * 1000);
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
                        if (!that.validateDataPresence()) return false;

                        val = parseInt(val, 10);
                        //var oldValue = parseInt(that.sensordata.was.substr(functions[unit].from, functions[unit].length), 10);
                        var currentValue = parseInt(that.sensordata.is.substr(functions[unit].from, functions[unit].length), 10);
                        var triggered = (currentValue == val);

                        return that.processCondition(unit + "_is_equal", val, triggered);
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
                        if (!that.validateDataPresence()) return false;

                        val = parseInt(val, 10);
                        //var oldValue = parseInt(that.sensordata.was.substr(functions[unit].from, functions[unit].length), 10);
                        var currentValue = parseInt(that.sensordata.is.substr(functions[unit].from, functions[unit].length), 10);
                        var triggered = (currentValue > val);
                        return that.processCondition(unit + "_is_gt", val, triggered);
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