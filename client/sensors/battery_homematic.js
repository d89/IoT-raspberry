"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class battery_homematic extends baseSensor
{
    constructor(options)
    {
        super("battery_homematic", "Battery (Homematic)", options);
        this.read();
    }

    read()
    {
        var that = this;
        var thermostatName = that.options.thermostatName;

        fhem.readValue(thermostatName, "batteryLevel", function(err, body)
        {
            if (err) {
                that.logger.error(err);
            } else {

                if (body.indexOf("ok") !== -1) {
                    body = 3.3;
                } else if (body.indexOf("low") !== -1) {
                    body = 0;
                }

                var battery = parseFloat(body, 10);

                if (isNaN(battery)) {
                    that.logger.error("fhem homematic get battery could not parse " + body);
                } else {
                    that.senddata(battery, that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }
}

module.exports = battery_homematic;