var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');
var pushService = require("./push");

MongoClient.connect('mongodb://localhost/IoT', function(err, database)
{
    if (err)
    {
        logger.error("could not connect to database", err);
        process.exit();
    }

    logger.info("DATABASE CONNECTED");

    var storage = require("./storage");
    storage.setDatabase(database);

    pushService.pushAll(function(err, msg)
    {
        if (err)
        {
            logger.error("error pushing", err);
        }
        else
        {
            logger.info("done pushing to all clients", err, msg);
        }

        process.exit();
    });
});





