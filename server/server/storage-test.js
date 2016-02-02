var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');
var moment = require('moment');

MongoClient.connect('mongodb://localhost/IoT', function(err, database)
{
    if (err) throw err;

    logger.info("DATABASE CONNECTED");

    var storage = require("./storage");
    storage.setDatabase(database);

    require("./storage").dailySummary("Davids IoT-Raspberry", function(res, err)
    {
        console.log(res, err);
    });

    /*
    require("./maintenance").info(function(err, msg)
    {
        console.log(err, msg);
    });
    */
});





