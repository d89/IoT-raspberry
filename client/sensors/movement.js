"use strict";

var fs = require("fs");
var baseSensor = require("./baseSensor");

// ######################################################

class movement extends baseSensor
{
    constructor(options)
    {
        super("movement" + options.suffix, "Movement (Sensor " + options.suffix + ")", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('pir', [that.options.pin, that.options.interval], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).state;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = movement;