"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class lux extends baseSensor
{
    constructor(options)
    {
        super("lux", "Light intensity Z-Wave (Lux)", options);
        this.read();
    }

    read()
    {
        var that = this;
        var motionSensorName = this.options.motionSensorName;

        fhem.readValue(motionSensorName, "luminance", function(err, body)
        {
            if (err) {
                that.logger.error(err);
            } else {
                var lux = body.match(/(\d+)\sLux/);

                if (!lux) {
                    that.logger.error("fhem zwave get lux could not parse " + body);
                } else {
                    lux = lux[1];
                    that.senddata(lux, that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }
}

module.exports = lux;