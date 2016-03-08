"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class watt extends baseSensor
{
    constructor(options)
    {
        super("watt", options);
        this.read();
    }

    read()
    {
        var that = this;

        var switchName = that.options.switchName;
        switchName = switchName || "ZWave_SWITCH_BINARY_15";

        var requestObject = {
            "detail": switchName
        };

        requestObject["dev.get" + switchName] = switchName;
        requestObject["cmd.get" + switchName] = "get";
        requestObject["arg.get" + switchName] = "smStatus";
        requestObject["val.get" + switchName] = "";
        requestObject["XHR"] = "1";

        fhem.post("fhem", requestObject, function(err, msg)
        {
            if (err) {
                logger.error(err);
            } else {
                var watt = msg.match(/\d+\.\d+/);
                if (watt.length !== 1 || isNaN(parseFloat(watt[0], 10))) {
                    logger.error("fhem zwave get measured watt could not parse " + msg);
                } else {
                    that.senddata(watt[0], that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, INTERVAL);
        });
    }
}

module.exports = watt;