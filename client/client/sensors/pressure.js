"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class pressure extends baseSensor
{
    constructor(options)
    {
        super("pressure", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('barometric', [], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).pressure;
                //console.log("pressure", data);
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