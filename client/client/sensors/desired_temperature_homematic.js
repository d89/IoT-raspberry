"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class desired_temperature_homematic extends baseSensor
{
    constructor(options)
    {
        super("desired_temperature_homematic", options);
        this.read();
    }

    read()
    {
        var that = this;

        var thermostatName = that.options.thermostatName;
        var requestObject = '{ReadingsVal("' + thermostatName + '_Clima","desired-temp","")}';
        var url = "fhem?cmd=" + requestObject + "&XHR=1";

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error(err);
            } else {
                if (body.indexOf("on") !== -1) body = 30.5;
                var temp = parseFloat(body, 10);

                if (isNaN(temp)) {
                    logger.error("fhem homematic get desired temperature could not parse " + body);
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
var t = new desired_temperature_homematic({
    thermostatName: "HM_37F678"
});
*/

module.exports = desired_temperature_homematic;