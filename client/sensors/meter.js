"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");

// ######################################################

class meter extends baseSensor
{
    constructor(options)
    {
        super("meter", "Energy Meter (kwh)", options);
        this.read();
    }

    read()
    {
        var that = this;
        var switchName = that.options.switchName;
        var t = switchName || "ZWave_SWITCH_BINARY_17";

        fhem.readValue(switchName, "energy", function(err, msg)
        {
            if (err) {
                logger.error(err);
            } else {
                var meter = msg.split(" kwH")[0];
                if (isNaN(parseFloat(meter, 10))) {
                    logger.error("fhem zwave get measured meter could not parse " + msg);
                } else {
                    var kwh = meter[0];
                    that.senddata(kwh, that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }
}

module.exports = meter;