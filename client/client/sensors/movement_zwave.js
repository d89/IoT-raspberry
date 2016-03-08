"use strict";

var baseSensor = require("./baseSensor");
var config = require("../config");
var logger = require("../logger");
var fhem = require("../fhemmanagement");
const INTERVAL = 5000;

// ######################################################

class movement_zwave extends baseSensor
{
    constructor(options)
    {
        super("movement_zwave", options);
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
        var refreshattribute = "sbStatus";

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
        requestObject["arg.get" + motionSensorName] = "sbStatus";
        requestObject["val.get" + motionSensorName] = "";
        requestObject["XHR"] = "1";

        fhem.post("fhem", requestObject, function(err, msg)
        {
            if (err) {
                logger.error(err);
            } else {
                if (msg.indexOf("WAKEUP") === -1)
                {
                    var isOpen = msg.indexOf("state:open") !== -1;
                    var isClosed = msg.indexOf("state:closed") !== -1;

                    if (!isOpen && !isClosed)
                    {
                        logger.error("z-wave motion sensor unknown state: " + msg);
                    }

                    that.senddata((isOpen ? 1 : 0), that);
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
var l = new movement_zwave({
    motionSensorName: "ZWave_SENSOR_BINARY_16",
    onData: function(data, val)
    {
        console.log(data, val);
    }
});
*/

module.exports = movement_zwave;