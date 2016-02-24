"use strict";

var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");

exports.exposed = function()
{
    return {
        act: {
            method: exports.act,
            params: [{
                name: "temp",
                isOptional: false,
                dataType: "float",
                notes: "temperature that should be set"
            },{
                name: "thermostatName",
                isOptional: true,
                dataType: "string",
                notes: "ID of the fhem thermostat. Defaults to ZWave_THERMOSTAT_9"
            }]
        }
    };
};

exports.act = function(temp, thermostatName)
{
    thermostatName = thermostatName || "ZWave_THERMOSTAT_9";

    var requestObject = {
        "detail": thermostatName
    };

    temp = parseFloat(temp, 10);

    requestObject["dev.set" + thermostatName] = thermostatName;
    requestObject["cmd.set" + thermostatName] = "set";
    requestObject["arg.set" + thermostatName] = "setpointHeating";
    requestObject["val.set" + thermostatName] = ("" + parseInt(temp, 10)); //only full numbers allowed

    fhem.post("fhem", requestObject, function(err, msg)
    {
        if (err) {
            logger.error(err);
        } else {
            logger.info(msg);
        }
    });
};

//exports.act(19.5, "HM_37F678");