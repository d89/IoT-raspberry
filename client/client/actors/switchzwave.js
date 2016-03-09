var logger = require('../logger');
var config = require('../config');
var fhem = require("../fhemmanagement");

exports.exposed = function()
{
    return {
        on: {
            method: exports.on,
            params: []
        },
        off: {
            method: exports.off,
            params: []
        }
    };
};

exports.turnSwitch = function(state, switchName)
{
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
            logger.error(err);
        }
        else
        {
            logger.info("zwave switch set to " + state);
        }
    });
};

exports.on = function(switchName)
{
    switchName = switchName || "ZWave_SWITCH_BINARY_17";
    logger.info("enabling zwave switch " + switchName);
    exports.turnSwitch(true, switchName);
};

exports.off = function(switchName)
{
    switchName = switchName || "ZWave_SWITCH_BINARY_17";
    logger.info("disabling zwave switch " + switchName);
    exports.turnSwitch(false, switchName);
};