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
                    isOptional: false,
                    dataType: "string",
                    notes: "ID of the fhem thermostat."
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

        fhem.setValue(thermostatName, "setpointHeating", ("" + parseInt(temp, 10)), function(err, msg)
        {
            if (err)
            {
                cb(err);
            }
            else
            {
                cb(null, msg);
            }
        });
    }
}

module.exports = set_temperature_zwave;

