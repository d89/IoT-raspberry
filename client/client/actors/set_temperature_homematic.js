"use strict";

var config = require("../config");
var logger = require("../logger");
var request = require("request");

exports.exposed = function()
{
    return {
        act: {
            method: exports.act,
            params: [{
                name: "temperature",
                isOptional: false,
                dataType: "float",
                notes: "temperature that should be set"
            },{
                name: "thermostatName",
                isOptional: true,
                dataType: "string",
                notes: "ID of the fhem thermostat. Defaults to HM_37F678"
            }]
        }
    };
};

exports.act = function(temperature, thermostatName)
{
    thermostatName = thermostatName || "HM_37F678";

    var requestObject = {
        "detail": thermostatName + "_Clima"
    };

    temperature = parseFloat(temperature, 10);

    requestObject["dev.set" + thermostatName + "_Clima"] = thermostatName + "_Clima";
    requestObject["cmd.set" + thermostatName + "_Clima"] = "set";
    requestObject["arg.set" + thermostatName + "_Clima"] = "desired-temp";
    requestObject["val.set" + thermostatName + "_Clima"] = temperature;

    var url = "http://127.0.0.1:" + config.fhem.port + "/fhem";

    request.post(url, {
        auth: {
            user: config.fhem.basic_auth_username,
            pass: config.fhem.basic_auth_password
        }
    }, function (error, response, body)
    {
        if (error)
        {
            logger.error("fhem set desired temperature error " + error);
        }
        else if (response && response.statusCode && response.statusCode != 200)
        {
            logger.error("fhem set desired temperature response code " + response.statusCode);
        }
        else //success
        {
            logger.info("successfully set temperature for " + thermostatName + " to " + temperature);
        }
    });
};

//exports.act(19.5, "HM_37F678");