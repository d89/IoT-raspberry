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
                params: []
            },
            off: {
                method: this.off.bind(this),
                params: []
            }
        };
    }

    turnSwitch(state, switchName)
    {
        var that = this;
        
        var requestObject = {
            "detail": switchName
        };

        requestObject["dev.get" + switchName] = switchName;
        requestObject["cmd.get" + switchName] = "set";
        requestObject["arg.get" + switchName] = (state ? "on" : "off");
        requestObject["val.get" + switchName] = "";
        requestObject["XHR"] = "1";

        fhem.post("fhem", requestObject, function(err, msg)
        {
            if (err)
            {
                that.logger.error(err);
            }
            else
            {
                that.logger.info("zwave switch set to " + state);
            }
        });
    }

    on(switchName)
    {
        switchName = switchName || "ZWave_SWITCH_BINARY_17";
        this.logger.info("enabling zwave switch " + switchName);
        this.turnSwitch(true, switchName);
    }

    off(switchName)
    {
        switchName = switchName || "ZWave_SWITCH_BINARY_17";
        this.logger.info("disabling zwave switch " + switchName);
        this.turnSwitch(false, switchName);
    }
}

module.exports = switchzwave;