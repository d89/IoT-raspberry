"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class measured_temperature_zwave extends baseSensor
{
    constructor(options)
    {
        super("measured_temperature_zwave", options);
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
        var refreshattribute = "smStatus";

        var url = `fhem?detail=${t}&dev.get${t}=${t}&cmd.get${t}=get&arg.get${t}=${refreshattribute}&val.get${t}=&XHR=1`;

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error("zwave measured refresh: ", err);
            } else {
                //logger.info("zwave measured refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        that.refresh();

        var thermostatName = that.options.thermostatName;
        var requestObject = '{ReadingsVal("' + thermostatName + '","temperature","")}';
        var url = "fhem?cmd=" + requestObject + "&XHR=1";

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error(err);
            } else {
                var temp = parseFloat(body, 10);

                if (isNaN(temp)) {
                    logger.error("fhem zwave get measured temperature could not parse " + body);
                } else {
                    //console.log("temp", temp);
                    that.senddata(temp, that);
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
var t = new measured_temperature_zwave({
    thermostatName: "ZWave_THERMOSTAT_9",
    onData: function(data, val)
    {
        console.log(data, val);
    }
});
*/

module.exports = measured_temperature_zwave;