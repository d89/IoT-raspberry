"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var request = require("request");
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
        var requestObject = '{ ReadingsVal("' + thermostatName + '_Clima","desired-temp","") }';
        var url = "http://127.0.0.1:" + config.fhem.port + "/fhem?cmd=" + requestObject + "&XHR=1";

        request.get(url, {
            auth: {
                user: config.fhem.basic_auth_username,
                pass: config.fhem.basic_auth_password
            }
        }, function (error, response, body)
        {
            if (error)
            {
                logger.error("fhem get desired temperature error " + error);
            }
            else if (response && response.statusCode && response.statusCode != 200)
            {
                logger.error("fhem get desired temperature response code " + response.statusCode);
            }
            else //success
            {
                //"on" is the absolute max. Set to 30.5 (= max + 0.5) to indicate this
                if (body.indexOf("on") !== -1)
                {
                    body = 30.5;
                }

                var temp = parseFloat(body, 10);

                if (isNaN(temp))
                {
                    logger.error("fhem get desired temperature could not parse " + body);
                }
                else
                {
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