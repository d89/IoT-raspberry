"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class altitude extends baseSensor
{
    constructor(options)
    {
        super("altitude", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('barometric', [], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).altitude;
                //console.log("altitude", data);
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