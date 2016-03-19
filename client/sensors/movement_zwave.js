"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class movement_zwave extends baseSensor
{
    constructor(options)
    {
        super("movement_zwave", "Detected Movement (Z-Wave)", options);
        this.read();
    }

    //no refresh necessary, because we added the raspberry as association and will receive the
    //measured values in a fixed time frame without needing to ask for them
    read()
    {
        var that = this;
        var motionSensorName = this.options.motionSensorName;

        fhem.readValue(motionSensorName, "state", function(err, body)
        {
            if (err) {
                that.logger.error(err);
            } else {
                var isOpen = body.indexOf("open") !== -1;
                var isClosed = body.indexOf("closed") !== -1;

                if (!isOpen && !isClosed)
                {
                    that.logger.error("z-wave motion sensor unknown state: " + body);
                }

                var state = (isOpen ? 1 : 0);

                that.senddata(state, that);
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }
}

module.exports = movement_zwave;