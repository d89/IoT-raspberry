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
    var requestObject = {};
    temp = parseFloat(temp, 10);

    var url = `fhem?cmd=set ${thermostatName} desired-temp ${temp}&XHR=1`;
    console.log("posting to ", url);

    fhem.post(url, requestObject, function(err, msg)
    {
        if (err) {
            logger.error(err);
        } else {
            logger.info(msg);

            logger.info("sending burst for " + thermostatName);

            var requestObject = {
                "detail": thermostatName
            };

            requestObject["dev.set" + thermostatName] = thermostatName;
            requestObject["cmd.set" + thermostatName] = "set";
            requestObject["arg.set" + thermostatName] = "burstXmit";
            requestObject["val.set" + thermostatName] = "";

            fhem.post("fhem", requestObject, function(err, msg)
            {
                if (err) {
                    logger.error(err);
                } else {
                    logger.info(msg);
                }
            });
        }
    });
};

//exports.act(19.5, "HM_37F678");