"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class lux extends baseSensor
{
    constructor(options)
    {
        super("lux", options);
        this.read();

        this.refreshCounter = 0;
    }


    refresh()
    {
        var shouldTrigger = (this.refreshCounter % 10 === 0)
        this.refreshCounter++;

        if (!shouldTrigger)
        {
            return;
        }

        var t = this.options.motionSensorName;
        var refreshattribute = "smStatus";

        var url = `fhem?detail=${t}&dev.get${t}=${t}&cmd.get${t}=get&arg.get${t}=${refreshattribute}&val.get${t}=&XHR=1`;

        fhem.get(url, function(err, body)
        {
            if (err) {
                logger.error("zwave measured refresh: ", err);
            } else {
                //logger.info("zwave measured refresh: ", body);
            }
        });
    }

    read()
    {
        var that = this;
        that.refresh();

        var motionSensorName = that.options.motionSensorName;

        var requestObject = {
            "detail": motionSensorName
        };

        requestObject["dev.get" + motionSensorName] = motionSensorName;
        requestObject["cmd.get" + motionSensorName] = "get";
        requestObject["arg.get" + motionSensorName] = "smStatus";
        requestObject["val.get" + motionSensorName] = "";
        requestObject["XHR"] = "1";

        fhem.post("fhem", requestObject, function(err, msg)
        {
            if (err) {
                logger.error(err);
            } else {
                if (msg.indexOf("WAKEUP") === -1)
                {
                    var lux = msg.match(/(\d+)\sLux/);

                    if (!lux) {
                        logger.error("fhem zwave get lux could not parse " + msg);
                    } else {
                        lux = lux[1];
                        that.senddata(lux, that);
                    }
                }
            }

            setTimeout(function()
            {
                that.read();
            }, INTERVAL);
        });
    }
}

/*
var l = new lux({
    motionSensorName: "ZWave_SENSOR_BINARY_16",
    onData: function(data, val)
    {
        console.log(data, val);
    }
});
*/

module.exports = lux;