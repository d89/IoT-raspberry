"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class altitude extends baseSensor
{
    constructor(options)
    {
        super("altitude", "Altitude (Meter)", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('barometric', [that.options.pin, that.options.interval], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).altitude;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = altitude;