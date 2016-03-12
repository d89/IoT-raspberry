"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");

// ######################################################

class watt extends baseSensor
{
    constructor(options)
    {
        super("watt", "Power consumption (Watt)", options);
        this.read();
    }

    read()
    {
        var that = this;
        var switchName = that.options.switchName;
        var t = switchName || "ZWave_SWITCH_BINARY_17";
        var refreshattribute = "smStatus";
        var url = `fhem?detail=${t}&dev.get${t}=${t}&cmd.get${t}=get&arg.get${t}=${refreshattribute}&val.get${t}=&XHR=1`;

        fhem.get(url, function(err, msg)
        {
            if (err) {
                logger.error(err);
            } else {
                var watt = msg.match(/\d+\.\d+/);
                if (!watt || watt.length !== 1 || isNaN(parseFloat(watt[0], 10))) {
                    logger.error("fhem zwave get measured watt could not parse " + msg);
                } else {
                    var w = watt[0];
                    that.senddata(w, that);
                }
            }

            setTimeout(function()
            {
                that.read();
            }, that.options.interval * 1000);
        });
    }
}

module.exports = watt;