"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class poti extends baseSensor
{
    constructor(options)
    {
        super("poti", "Potentiometer", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('pcf8591', [that.options.pin, that.options.interval], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).poti;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = poti;