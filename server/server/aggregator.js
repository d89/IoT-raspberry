var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');
var config = require('./config');
var storage = require("./storage");

MongoClient.connect('mongodb://localhost/IoT', function(err, database)
{
    if (err) throw err;

    logger.info("DATABASE CONNECTED");
    storage.setDatabase(database);

    fullAggregation();
});

function fullAggregation()
{
    storage.fullAggregation(function(err, msg)
    {
        if (err)
        {
            logger.error("fullAggregation error: " + err);
            storage.logEntry("error", "fullAggregation error: " + err, true);
            process.exit(1);
        }

        logger.info("fullAggregation success: " + msg);
        storage.logEntry("info", "fullAggregation success: " + msg, true);
        logger.info("##################################################");
        oldAggregation();
    });
}

function oldAggregation()
{
    storage.oldAggregation(function(err, msg)
    {
        if (err)
        {
            logger.error("oldAggregation error: " + err);
            storage.logEntry("error", "oldAggregation error: " + err, true);
        }
        else
        {
            logger.info("oldAggregation success: " + msg);
            storage.logEntry("info", "oldAggregation success: " + msg, true);
        }

        logger.info("##################################################");

        process.exit(1);
    });
}