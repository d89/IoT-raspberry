var storage = require('./storage');
var gcm = require('node-gcm');
var config = require('./config');
var logger = require('./logger');
var async = require("async");

exports.pushAll = function(cbFinished)
{
    var coll = storage.getDatabase().collection('pushtokens');

    coll.distinct("client", function(err, docs)
    {
        if (err)
        {
            return cbFinished("Error retrieving data: " + err);
        }

        logger.info("distinct push notification receivers", docs);

        var queries = [];

        docs.forEach(function(clientName)
        {
            queries.push(function(cb)
            {
                exports.push(clientName, cb);
            });
        });

        async.series(queries, function(err, data)
        {
            cbFinished(err, data);
        });
    });
};

exports.push = function(clientName, cb)
{
    logger.info("pushing to " + clientName);
    storage.getPushTokens(clientName, function(err, docs)
    {
        if (err)
            return cb(err);

        var pushIds = [];
        docs.forEach(function(d)
        {
            pushIds.push(d.token);
        });

        logger.info("pushing to ids:", pushIds);

        exports.pushMessage(config.gcmApiKey, pushIds, function(err, resp)
        {
            if (err)
            {
                logger.error("push send error", err);
                return cb(err);
            }
            else
            {
                exports.processGcmResponse(pushIds, resp, cb);
            }
        });
    });
};

exports.processGcmResponse = function(pushIds, resp, cb)
{
    logger.info("processing GCM response", resp);
    logger.info("GCM successfuly sent push messages: " + resp.success);
    logger.info("GCM errors for push messages: " + resp.failure);

    var i = 0;
    var delTokens = [];

    resp.results.forEach(function(r)
    {
        if (r.error && r.error === "NotRegistered")
        {
            delTokens.push(pushIds[i]);
        }

        i++;
    });

    storage.removePushTokens(delTokens, function(err, resp)
    {
        if (err)
        {
            logger.error("push token remove error", err);
            return cb(err);
        }
        else
        {
            logger.info("push tokens removed ", delTokens, resp);
            return cb(null, "all successful!");
        }
    });
};

exports.pushMessage = function(GCM_API_KEY, REQ_TOKENS, cb)
{
    // Set up the sender with you API key
    var sender = new gcm.Sender(GCM_API_KEY);

    var message = new gcm.Message({
        priority: 'high',
        contentAvailable: true,
        timeToLive: 3,
        data: {
            key1: 'message1'
        }
    });

    // Now the sender can be used to send messages
    sender.send(message, { registrationTokens: REQ_TOKENS }, function (err, response)
    {
        cb(err, response);
    });
};