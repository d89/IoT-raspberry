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

    return exports.registeredActors;
};