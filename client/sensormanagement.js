var config = require('./config');
var logger = require('./logger');

exports.registeredSensors = {};

exports.has = function(sensor)
{
    return (sensor in exports.registeredSensors);
};

exports.hasOneOf = function(sensorArray)
{
    for (var i = 0; i < sensorArray.length; i++)
    {
        if (exports.has(sensorArray[i]))
        {
            return true;
        }
    }

    return false;
};

exports.init = function(opt)
{
    //do not reregister
    if (Object.keys(exports.registeredSensors).length !== 0)
    {
        logger.info("Sensors already registered, skipping.");
        return exports.registeredSensors;
    }

    // ----------------------------------------------------

    Object.keys(config.sensors).forEach(function(sensorKey)
    {
        var file = config.sensors[sensorKey].file || "./sensors/" + sensorKey;
        var sensor = require(file);
        var options = config.sensors[sensorKey].options || {};
        options.onData = opt.onData;
        exports.registeredSensors[sensorKey] = new sensor(options);
    });

    return exports.registeredSensors;
};