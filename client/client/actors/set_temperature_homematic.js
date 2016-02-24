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
                notes: "ID of the fhem thermostat. Defaults to HM_37F678"
            }]
        }
    };
};

exports.act = function(temp, thermostatName)
{
    thermostatName = thermostatName || "HM_37F678";

    thermostatName += "_Clima";

    var requestObject = {
        "detail": thermostatName
    };

    temp = parseFloat(temp, 10);

    requestObject["dev.set" + thermostatName] = thermostatName;
    requestObject["cmd.set" + thermostatName] = "set";
    requestObject["arg.set" + thermostatName] = "desired-temp";
    requestObject["val.set" + thermostatName] = "" + temp;

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