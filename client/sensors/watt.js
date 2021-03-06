"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var fhem = require("../fhemmanagement");

// ######################################################

class watt extends baseSensor
{
    constructor(options)
    {
        super("watt", "Power consumption (Watt)", options);
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
        var refreshattribute = "smStatus";

        fhem.refreshAttribute(switchName, refreshattribute, function(err, body)
        {
            if (err) {
                that.logger.error("zwave switch refresh: ", err);
            } else {
                //that.logger.info("zwave switch refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        var switchName = that.options.switchName;
        var t = switchName || "ZWave_SWITCH_BINARY_17";
        that.refresh();

        fhem.readValue(t, "power", function(err, msg)
        {
            if (err) {
                that.logger.error(err);
            } else {
                var watt = msg.match(/\d+\.\d+/);
                if (!watt || watt.length !== 1 || isNaN(parseFloat(watt[0], 10))) {
                    that.logger.error("fhem zwave get measured watt could not parse " + msg);
                } else {
                    var w = watt[0];
                    that.senddata(w, that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }
}

module.exports = watt;