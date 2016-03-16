"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var fhem = require("../fhemmanagement");

// ######################################################

class switchzwave extends baseActor
{
    constructor(options)
    {
        super("switchzwave", options);
    }

    exposed()
    {
        return {
            on: {
                method: this.on.bind(this),
                params: [{
                    name: "switchName",
                    isOptional: false,
                    dataType: "string",
                    notes: "fhem name of the switch to be turned on"
                }]
            },
            off: {
                method: this.off.bind(this),
                params: [{
                    name: "switchName",
                    isOptional: false,
                    dataType: "string",
                    notes: "fhem name of the switch to be turned off"
                }]
            }
        };
    }

    turnSwitch(state, switchName, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        fhem.setValue(switchName, (state ? "on" : "off"), "", function(err, msg)
        {
            if (err)
            {
                cb(err);
            }
            else
            {
                cb(null, "zwave switch set to " + state);
            }
        });
    }

    on(switchName, cb)
    {
        switchName = switchName || "ZWave_SWITCH_BINARY_17";
        this.logger.info("enabling zwave switch " + switchName);
        this.turnSwitch(true, switchName, cb);
    }

    off(switchName, cb)
    {
        switchName = switchName || "ZWave_SWITCH_BINARY_17";
        this.logger.info("disabling zwave switch " + switchName);
        this.turnSwitch(false, switchName, cb);
    }
}

module.exports = switchzwave;