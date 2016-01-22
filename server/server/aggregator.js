var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');
logger

const types = ["movement2", "sound", "humidity", "distance", "temperature", "cputemp", "mem", "load", "lightintensity", "light", "soundvol", "movement1"];

MongoClient.connect('mongodb://localhost/IoT', function(err, database)
{
    if (err) throw err;

    logger.info("DATABASE CONNECTED");
    var storage = require("./storage");
    storage.setDatabase(database);
    storage.fullAggregation();
});