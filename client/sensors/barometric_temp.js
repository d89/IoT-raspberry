"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class barometric_temp extends baseSensor
{
    constructor(options)
    {
        super("barometric_temp", "Temperature (Barometric)", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('barometric', [that.options.pin, that.options.interval], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).temp;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = barometric_temp;