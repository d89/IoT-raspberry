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
                exposedParent[unit + "_is_equal"] =
                {
                    method: function(val)
                    {
                        if (that.sensordata.is.length === null) return false;
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
                        if (that.sensordata.is.length === null) return false;
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
        var currDate = moment().format("YYYYMMDD");
        this.senddata(currDate, this);
    }
}

module.exports = date;