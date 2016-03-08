"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class battery_motionsensor_zwave extends baseSensor
{
    constructor(options)
    {
        super("battery_motionsensor_zwave", options);
        this.read();
        this.refreshCounter = 0;
    }

    refresh()
    {
        var shouldTrigger = (this.refreshCounter % 10 === 0)
        this.refreshCounter++;

        if (!shouldTrigger)
        {
            return;
        }

        var t = this.options.motionSensorName;
        var refreshattribute = "battery";

        var url = `fhem?detail=${t}&dev.get${t}=${t}&cmd.get${t}=get&arg.get${t}=${refreshattribute}&val.get${t}=&XHR=1`;

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error("zwave battery motion sensor refresh: ", err);
            } else {
                //logger.info("zwave battery motion sensor refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        this.refresh();

        var motionSensorName = this.options.motionSensorName;
        var requestObject = '{ReadingsVal("' + motionSensorName + '","battery","")}';
        var url = "fhem?cmd=" + requestObject + "&XHR=1";

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error(err);
            } else {
                var battery = parseFloat(body, 10);

                if (isNaN(battery)) {
                    logger.error("fhem zwave get motion sensor battery could not parse " + body);
                } else {
                    that.senddata(battery, that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, INTERVAL);
        });
    }
}

/*
var t = new battery_motionsensor_zwave({
    motionSensorName: "ZWave_SENSOR_BINARY_16",
    onData: function(data, val)
    {
        console.log(data, val);
    }
});
*/

module.exports = battery_motionsensor_zwave;