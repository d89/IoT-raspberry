"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var fhem = require("../fhemmanagement");

// ######################################################

class set_temperature_zwave extends baseActor
{
    constructor(options)
    {
        super("set_temperature_zwave", options);
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
                    notes: "ID of the fhem thermostat. Defaults to ZWave_THERMOSTAT_9"
                }]
            }
        };
    }

    settemp(temp, thermostatName)
    {
        var that = this;
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
            if (err)
            {
                that.logger.error(err);
            }
            else
            {
                that.logger.info(msg);
            }
        });
    }
}

module.exports = set_temperature_zwave;

