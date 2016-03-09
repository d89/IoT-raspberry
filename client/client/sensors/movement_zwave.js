"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class movement_zwave extends baseSensor
{
    constructor(options)
    {
        super("movement_zwave", options);
        this.read();
    }

    read()
    {
        var that = this;
        var motionSensorName = this.options.motionSensorName;
        var requestObject = '{ReadingsVal("' + motionSensorName + '","state","")}';
        var url = "fhem?cmd=" + requestObject + "&XHR=1";

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error(err);
            } else {
                var isOpen = body.indexOf("open") !== -1;
                var isClosed = body.indexOf("closed") !== -1;

                if (!isOpen && !isClosed)
                {
                    logger.error("z-wave motion sensor unknown state: " + body);
                }

                var state = (isOpen ? 1 : 0);

                that.senddata(state, that);
            }

            setTimeout(function()
            {
                that.read();
            }, INTERVAL);
        });
    }
}

module.exports = movement_zwave;