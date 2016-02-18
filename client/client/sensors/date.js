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

        that.read();

        setInterval(function()
        {
            that.read();
        }, 60000);
    }

    read()
    {
        var currDate = moment().format("YYYYMMDD");
        this.senddata(currDate, this);
    }
}

module.exports = date;