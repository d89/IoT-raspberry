"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class measured_temperature_homematic extends baseSensor
{
    constructor(options)
    {
        super("measured_temperature_homematic", "Measured Temp (Homematic)", options);
        this.read();
    }

    read()
    {
        var that = this;

        var thermostatName = that.options.thermostatName + '_Clima';

        fhem.readValue(thermostatName, "measured-temp", function(err, body)
        {
            if (err) {
                that.logger.error(err);
            } else {
                var temp = parseFloat(body, 10);
                if (isNaN(temp)) {
                    that.logger.error("fhem homematic get measured temperature could not parse " + body);
                } else {
                    that.senddata(temp, that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }
}

module.exports = measured_temperature_homematic;