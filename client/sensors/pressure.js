"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class pressure extends baseSensor
{
    constructor(options)
    {
        super("pressure", "Pressure (Pa)", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('barometric', [that.options.pin, that.options.interval], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).pressure;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = pressure;