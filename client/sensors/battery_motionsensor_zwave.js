"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class battery_motionsensor_zwave extends baseSensor
{
    constructor(options)
    {
        super("battery_motionsensor_zwave", "Battery Motion Sensor (Z-Wave)", options);
        this.read();
        this.refreshCounter = 0;
    }

    refresh()
    {
        var that = this;
        var shouldTrigger = (this.refreshCounter % 10 === 0)
        this.refreshCounter++;
        if (!shouldTrigger) return;

        var deviceName = this.options.motionSensorName;
        var refreshAttribute = "battery";
        fhem.refreshAttribute(deviceName, refreshAttribute, function(err, body)
        {
            if (err) {
                that.logger.error("zwave battery motion sensor refresh: ", err);
            } else {
                //that.logger.info("zwave battery motion sensor refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        this.refresh();

        var motionSensorName = this.options.motionSensorName;
        fhem.readValue(motionSensorName, "battery", function(err, body)
        {
            if (err) {
                that.logger.error(err);
            } else {
                var battery = parseFloat(body, 10);

                if (isNaN(battery)) {
                    that.logger.error("fhem zwave get motion sensor battery could not parse " + body);
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

module.exports = battery_motionsensor_zwave;