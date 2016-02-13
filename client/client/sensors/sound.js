"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class sound extends baseSensor
{
    constructor(options)
    {
        super("sound", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('lm393', [], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).state === true ? 1 : 0;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = sound;