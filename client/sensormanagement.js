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

exports.checkDependencies = function()
{
    logger.info("checking sensor dependencies");

    var errorMessages = [];

    Object.keys(exports.registeredSensors).forEach(function(sensorKey)
    {
        var sensor = exports.registeredSensors[sensorKey];
        var result = sensor.dependenciesFulfilled();

        logger.info("... checking dependencies of " + sensorKey);

        if (result !== true)
        {
            var msg = "Dependency for sensor " + sensorKey + " is not fulfilled: " + result;
            logger.error(msg);
            errorMessages.push(msg);
        }
    });

    if (errorMessages.length > 0)
    {
        throw new Error("Cancelling startup, not all sensor dependencies are fulfilled: " + errorMessages.join(", "));
    }

    logger.info("all sensor dependencies fulfilled.");
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
        var file = config.sensors[sensorKey].file || "./sensors/" + sensorKey + ".js";
        var sensor = require(file);
        var options = config.sensors[sensorKey].options || {};
        options.onData = opt.onData;
        exports.registeredSensors[sensorKey] = new sensor(options);
    });

    //check dependencies, after all sensors have been initialized
    exports.checkDependencies();

    return exports.registeredSensors;
};