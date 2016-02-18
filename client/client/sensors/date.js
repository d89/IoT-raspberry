"use strict";

var baseSensor = require("./baseSensor");
var moment = require("moment");

// ######################################################

class date extends baseSensor
{
    constructor(options)
    {
        super("date", options);

        var that = this;

        // try after connection
        setTimeout(function()
        {
            that.read();
        }, 5000);

        setInterval(function()
        {
            that.read();
        }, 60000);
    }

    exposed(val)
    {
        var exposedParent = super.exposed();
        var that = this;

        var functions =
        {
            years: {
                from: 0,
                length: 4
            },
            months: {
                from: 4,
                length: 2
            },
            days: {
                from: 6,
                length: 2
            }
        };

        for (var unit in functions)
        {
            (function(unit)
            {
                exposedParent[unit + "_is_equal"] = function(val)
                {
                    if (that.sensordata.is.length === null) return false;
                    var readValue = that.sensordata.is.substr(functions[unit].from, functions[unit].length);
                    var triggered = (readValue == val);
                    return that.processCondition(triggered);
                };

                exposedParent[unit + "_is_gt"] = function(val)
                {
                    if (that.sensordata.is.length === null) return false;
                    var readValue = that.sensordata.is.substr(functions[unit].from, functions[unit].length);
                    var triggered = (readValue > val);
                    return that.processCondition(triggered);
                };

                exposedParent[unit + "_became_equal"] = function(val)
                {
                    if (that.sensordata.is === null || that.sensordata.was === null) return false;
                    var readValue = that.sensordata.is.substr(functions[unit].from, functions[unit].length);
                    var oldValue = that.sensordata.was.substr(functions[unit].from, functions[unit].length);
                    var triggered = (readValue == val && oldValue != val);
                    return that.processCondition(triggered);
                };

                exposedParent[unit + "_became_gt"] = function(val)
                {
                    if (that.sensordata.is === null || that.sensordata.was === null) return false;
                    var readValue = that.sensordata.is.substr(functions[unit].from, functions[unit].length);
                    var oldValue = that.sensordata.was.substr(functions[unit].from, functions[unit].length);
                    var triggered = (readValue > val && !(oldValue > val));
                    return that.processCondition(triggered);
                };
            }(unit));
        }

        delete exposedParent["is_lt"];
        delete exposedParent["became_lt"];

        return exposedParent;
    }

    read()
    {
        var currDate = moment().format("YYYYMMDD");
        this.senddata(currDate, this);
    }
}

module.exports = date;