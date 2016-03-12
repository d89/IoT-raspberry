"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class humidity extends baseSensor
{
    constructor(options)
    {
        super("humidity", "Humidity (percent)", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('dht11', [that.options.pin, that.options.interval], function ondata(data)
        {
            try
            {
                var humidity = JSON.parse(data.toString()).humidity;
                that.senddata(humidity, that);
            }
            catch (err)
            {
                //fails from time to time without reason, no need to log that
                //that.logger.error(err, data);
                return;
            }
        });
    }
}

module.exports = humidity;