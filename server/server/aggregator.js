var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');
var config = require('./config');

MongoClient.connect('mongodb://localhost/IoT', function(err, database)
{
    if (err) throw err;

    logger.info("DATABASE CONNECTED");
    var storage = require("./storage");
    storage.setDatabase(database);
    storage.fullAggregation(function(err, msg)
    {
        if (err)
        {
            logger.error("Aggregation error: " + err);
            storage.logEntry("error", "Aggregation error: " + err, true);
        }
        else
        {
            logger.info("Aggregation success: " + msg);
            storage.logEntry("info", "Aggregation success: " + msg, true);
        }

        logger.info("##################################################");

        process.exit(1);
    });
});