var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');
var moment = require('moment');

MongoClient.connect('mongodb://localhost/IoT', function(err, database)
{
    if (err) throw err;

    logger.info("DATABASE CONNECTED");

    var storage = require("./storage");
    storage.setDatabase(database);

    var aggregationpoints = database.collection('aggregationpoints');

    var start = moment().subtract(2, "day");
    var end = moment().subtract(1, "day");

    aggregationpoints.aggregate
    ([
        {
            $match: {
                from: { $gte: start.toDate() },
                to: { $lte: end.toDate() },
                client_id: "Davids IoT-Raspberry"
            }
        },
        {
            $group:
            {
                _id: '$type',
                avg: {$avg: '$avg'}
            }
        }
    ]).toArray(function(err, docs)
    {
        console.log("aggregation for period " + start + " to " + end, docs)

        //TODO what if empty, for example for the current day? Have to fetch from live then
    });




});





