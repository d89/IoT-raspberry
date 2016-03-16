"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class light extends baseSensor
{
    constructor(options)
    {
        super("light", "Light State", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('light', [that.options.pin, that.options.interval], function ondata(data)
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

    // ----------------------------------------------
}

module.exports = light;