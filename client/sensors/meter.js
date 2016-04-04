"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class meter extends baseSensor
{
    constructor(options)
    {
        super("meter", "Energy Meter (kwh)", options);
        this.read();

        this.refreshCounter = 0;
    }

    refresh()
    {
        var that = this;
        var shouldTrigger = (this.refreshCounter % 10 === 0)
        this.refreshCounter++;
        if (!shouldTrigger) return;

        var switchName = that.options.switchName;
        var refreshattribute = "meter";

        fhem.refreshAttribute(switchName, refreshattribute, function(err, body)
        {
            if (err) {
                that.logger.error("zwave switch meter refresh: ", err);
            } else {
                //that.logger.info("zwave switch meter refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        var switchName = that.options.switchName;
        var t = switchName || "ZWave_SWITCH_BINARY_17";
        that.refresh();

        fhem.readValue(switchName, "energy", function(err, msg)
        {
            if (err) {
                that.logger.error(err);
            } else {
                var meter = msg.split(" kWh")[0];
                if (isNaN(parseFloat(meter, 10))) {
                    that.logger.error("fhem zwave get measured meter could not parse " + msg);
                } else {
                    that.senddata(meter, that);
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