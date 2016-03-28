"use strict";

var baseSensor = require("./baseSensor");
var sensormanagement = require("../sensormanagement");

// ######################################################

class soundvol extends baseSensor
{
    constructor(options)
    {
        super("soundvol", "Sound Volume", options);
        this.read();
    }

    dependenciesFulfilled()
    {
        return true;
    }

    read()
    {
        var that = this;

        that.spawn('soundvol', [that.options.pin, that.options.interval], function ondata(data)
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
}

module.exports = soundvol;