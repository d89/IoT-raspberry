"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class desired_temperature_homematic extends baseSensor
{
    constructor(options)
    {
        super("desired_temperature_homematic", "Desired Temp (Homematic)", options);
        this.read();
    }

    read()
    {
        var that = this;
        var thermostatName = that.options.thermostatName + "_Clima";

        fhem.readValue(thermostatName, "desired-temp", function(err, body)
        {
            if (err) {
                that.logger.error(err);
            } else {

                if (body.indexOf("on") !== -1) {
                    body = 30.5;
                } else if (body.indexOf("off") !== -1) {
                    body = 4.5;
                }

                var temp = parseFloat(body, 10);

                if (isNaN(temp)) {
                    that.logger.error("fhem homematic get desired temperature could not parse " + body);
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

module.exports = desired_temperature_homematic;