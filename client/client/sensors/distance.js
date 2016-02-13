"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class distance extends baseSensor
{
    constructor(options)
    {
        super("distance", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('hcsr04', [], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).distance;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = distance;