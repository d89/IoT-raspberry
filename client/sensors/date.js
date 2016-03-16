"use strict";

var baseSensor = require("./baseSensor");
var moment = require("moment");

// ######################################################

class date extends baseSensor
{
    constructor(options)
    {
        super("date", false, options);

        var that = this;

        // try after connection
        setTimeout(function()
        {
            that.read();
        }, 5000);

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

        ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach(function(day, i)
        {
            (function(day, count)
            {
                exposedParent["is_" + day] =
                {
                    method: function(val)
                    {
                        if (!that.validateDataPresence()) return false;
                        var dayOfWeek = moment(that.sensordata.is).toDate().getDay();
                        var triggered = (dayOfWeek == count);

                        return that.processCondition("is_" + day, val, triggered);
                    },
                    params: []
                };
            }(day, i));
        });

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