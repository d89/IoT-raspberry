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
            settemp: {
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

    settemp(temp, thermostatName, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        thermostatName = thermostatName || "HM_37F678";
        thermostatName += "_Clima";
        temp = parseFloat(temp, 10);

        fhem.setValue(thermostatName, "desired-temp", temp, function(err, msg)
        {
            if (err)
            {
                cb(err);
            }
            else
            {
                that.logger.info(msg);
                that.logger.info("sending burst for " + thermostatName);

                fhem.setValue(thermostatName, "burstXmit", "", function(err, msg)
                {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, msg);
                    }
                });
            }
        });
    }
}

module.exports = set_temperature_homematic;