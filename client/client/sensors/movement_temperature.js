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

    //no refresh necessary, because we added the raspberry as association and will receive the
    //measured values in a fixed time frame without needing to ask for them
    read()
    {
        var that = this;
        var motionSensorName = this.options.motionSensorName;

        fhem.readValue(motionSensorName, "temperature", function(err, body)
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