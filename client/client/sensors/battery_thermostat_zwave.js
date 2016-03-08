"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class battery_thermostat_zwave extends baseSensor
{
    constructor(options)
    {
        super("battery_thermostat_zwave", options);
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

        var t = this.options.thermostatName;
        var refreshattribute = "battery";

        var url = `fhem?detail=${t}&dev.get${t}=${t}&cmd.get${t}=get&arg.get${t}=${refreshattribute}&val.get${t}=&XHR=1`;

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error("zwave thermostat battery refresh: ", err);
            } else {
                //logger.info("zwave thermostat battery refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        this.refresh();

        var thermostatName = that.options.thermostatName;
        var requestObject = '{ReadingsVal("' + thermostatName + '","battery","")}';
        var url = "fhem?cmd=" + requestObject + "&XHR=1";

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error(err);
            } else {
                var battery = parseFloat(body, 10);

                if (isNaN(battery)) {
                    logger.error("fhem zwave get thermostat battery could not parse " + body);
                } else {
                    //console.log("temp", temp);
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
var t = new battery_thermostat_zwave({
    thermostatName: "ZWave_THERMOSTAT_9",
    onData: function(data, val)
    {
        console.log(data, val);
    }
});
*/

module.exports = battery_thermostat_zwave;