var config = require('./config');
var logger = require('./logger');

exports.registeredActors = {};

exports.has = function(actor)
{
    return (actor in exports.registeredActors);
};

exports.hasOneOf = function(actorArray)
{
    for (var i = 0; i < actorArray.length; i++)
    {
        if (exports.has(actorArray[i]))
        {
            return true;
        }
    }

    return false;
};

exports.checkDependencies = function()
{
    logger.info("checking actor dependencies");

    var errorMessages = [];

    Object.keys(exports.registeredActors).forEach(function(actorKey)
    {
        var actor = exports.registeredActors[actorKey];
        var result = actor.dependenciesFulfilled();

        logger.info("... checking dependencies of " + actorKey);

        if (result !== true)
        {
            var msg = "Dependency for actor " + actorKey + " is not fulfilled: " + result;
            logger.error(msg);
            errorMessages.push(msg);
        }
    });

    if (errorMessages.length > 0)
    {
        throw new Error("Cancelling startup, not all actor dependencies are fulfilled: " + errorMessages.join(", "));
    }

    logger.info("all actor dependencies fulfilled.");
};

exports.init = function(options)
{
    //do not reregister
    if (Object.keys(exports.registeredActors).length !== 0)
    {
        logger.info("Actors already registered, skipping.");
        return exports.registeredActors;
    }

    // ----------------------------------------------------

    Object.keys(config.actors).forEach(function(actorKey)
    {
        var file = config.actors[actorKey].file || "./actors/" + actorKey;
        var actor = require(file);
        var options = config.actors[actorKey].options || {};
        exports.registeredActors[actorKey] = new actor(options);
    });

    //check dependencies, after all actors have been initialized
    exports.checkDependencies();

    return exports.registeredActors;
};