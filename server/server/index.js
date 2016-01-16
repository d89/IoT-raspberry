var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');

MongoClient.connect('mongodb://localhost/IoT', function(err, database) {
    if (err) throw err;

    logger.info("DATABASE CONNECTED");

    var storage = require("./storage");
    storage.setDatabase(database);

    require("./data");
});
