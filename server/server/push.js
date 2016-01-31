var storage = require('./storage');
var gcm = require('node-gcm');
var config = require('./config');
var logger = require('./logger');

exports.push = function()
{
    storage.getPushTokens("TODO", function(err, docs)
    {
        var pushIds = [];
        docs.forEach(function(d)
        {
            pushIds.push(d.token);
        });

        logger.info("pushing to", pushIds);

        exports.pushMessage(config.gcmApiKey, pushIds, function(err, resp)
        {
            if (err)
            {
                logger.error("push send error", err);
            }
            else
            {
                exports.processGcmResponse(pushIds, resp);
            }
        });
    });
};

exports.processGcmResponse = function(pushIds, resp)
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
        }
        else
        {
            logger.info("push tokens removed ", delTokens, resp);
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