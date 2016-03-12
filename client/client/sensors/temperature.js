"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class temperature extends baseSensor
{
    constructor(options)
    {
        super("temperature", "Temperature (°C)", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('dht11', [that.options.pin, that.options.interval], function ondata(data)
        {
            try
            {
                var temperature = JSON.parse(data.toString()).temperature;
                that.senddata(temperature, that);
            }
            catch (err)
            {
                //fails from time to time without reason, no need to log that
                //that.logger.error(err, data);
            }
        });
    }
}

module.exports = temperature;