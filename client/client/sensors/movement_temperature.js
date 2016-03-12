"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");

// ######################################################

class movement_temperature extends baseSensor
{
    constructor(options)
    {
        super("movement_temperature", "Temperature Movement Sensor", options);
        this.read();
    }

    read()
    {
        var that = this;
        var motionSensorName = this.options.motionSensorName;
        var requestObject = '{ReadingsVal("' + motionSensorName + '","temperature","")}';
        var url = "fhem?cmd=" + requestObject + "&XHR=1";

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error(err);
            } else {
                var temp = parseFloat(body, 10);

                if (isNaN(temp)) {
                    logger.error("fhem zwave get temp could not parse " + body);
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

module.exports = movement_temperature;