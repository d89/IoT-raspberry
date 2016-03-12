"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var fhem = require("../fhemmanagement");

// ######################################################

class set_temperature_homematic extends baseActor
{
    constructor(options)
    {
        super("set_temperature_homematic", options);
    }

    exposed()
    {
        return {
            act: {
                method: this.settemp.bind(this),
                params: [{
                    name: "temp",
                    isOptional: false,
                    dataType: "float",
                    notes: "temperature that should be set"
                }, {
                    name: "thermostatName",
                    isOptional: true,
                    dataType: "string",
                    notes: "ID of the fhem thermostat. Defaults to HM_37F678"
                }]
            }
        };
    }

    settemp(temp, thermostatName)
    {
        var that = this;

        thermostatName = thermostatName || "HM_37F678";
        thermostatName += "_Clima";
        var requestObject = {};
        temp = parseFloat(temp, 10);

        var url = `fhem?cmd=set ${thermostatName} desired-temp ${temp}&XHR=1`;

        fhem.post(url, requestObject, function(err, msg)
        {
            if (err)
            {
                that.logger.error(err);
            }
            else
            {
                that.logger.info(msg);
                that.logger.info("sending burst for " + thermostatName);

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
                        that.logger.error(err);
                    } else {
                        that.logger.info(msg);
                    }
                });
            }
        });
    }
}

module.exports = set_temperature_homematic;