"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class barometric_temp extends baseSensor
{
    constructor(options)
    {
        super("barometric_temp", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('barometric', [], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).temp;
                //console.log("barometric_temp", data);
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