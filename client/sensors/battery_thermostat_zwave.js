"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class battery_thermostat_zwave extends baseSensor
{
    constructor(options)
    {
        super("battery_thermostat_zwave", "Battery Thermostat (Z-Wave)", options);
        this.read();
        this.refreshCounter = 0;
    }

    refresh()
    {
        var that = this;
        var shouldTrigger = (this.refreshCounter % 10 === 0)
        this.refreshCounter++;

        if (!shouldTrigger)
        {
            return;
        }

        var t = this.options.thermostatName;
        var refreshattribute = "battery";

        fhem.refreshAttribute(t, refreshattribute, function(err, body)
        {
            if (err) {
                that.logger.error("zwave thermostat battery refresh: ", err);
            } else {
                //that.logger.info("zwave thermostat battery refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        this.refresh();

        var thermostatName = that.options.thermostatName;

        fhem.readValue(thermostatName, "battery", function(err, body)
        {
            if (err) {
                that.logger.error(err);
            } else {
                var battery = parseFloat(body, 10);

                if (isNaN(battery)) {
                    that.logger.error("fhem zwave get thermostat battery could not parse " + body);
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

module.exports = battery_thermostat_zwave;