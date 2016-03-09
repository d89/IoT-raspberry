"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class meter extends baseSensor
{
    constructor(options)
    {
        super("meter", options);
        this.read();
    }

    read()
    {
        var that = this;

        var switchName = that.options.switchName;
        switchName = switchName || "ZWave_SWITCH_BINARY_17";

        var requestObject = {
            "detail": switchName
        };

        requestObject["dev.get" + switchName] = switchName;
        requestObject["cmd.get" + switchName] = "get";
        requestObject["arg.get" + switchName] = "meter";
        requestObject["val.get" + switchName] = "";
        requestObject["XHR"] = "1";

        fhem.post("fhem", requestObject, function(err, msg)
        {
            if (err) {
                logger.error(err);
            } else {
                var meter = msg.match(/\d+\.\d+/);
                if (!meter || meter.length !== 1 || isNaN(parseFloat(meter[0], 10))) {
                    logger.error("fhem zwave get measured meter could not parse " + msg);
                } else {
                    that.senddata(meter[0], that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, INTERVAL);
        });
    }
}

module.exports = meter;