var MongoClient = require('mongodb').MongoClient;
var moment = require("moment");
var async = require("async");
var logger = require("winston");
var db = null;
var queryAggregationCount = 0;
var progressNotifier = null;

exports.setDatabase = function(database)
{
    db = database;
};

exports.getDatabase = function()
{
    return db;
};

exports.setProgressNotifier = function(cb)
{
    progressNotifier = cb;
};

exports.sendProgress = function(data)
{
    if (progressNotifier)
        progressNotifier(data);
};

exports.persistDataPoint = function(type, data, client_id, cb)
{
    var dp = {
        type: type,
        data: parseFloat(data, 10),
        created: (new Date),
        client_id: client_id
    };

    db.collection('datapoints').insertOne(dp, function(err, result)
    {
        return cb(err, dp);
    });
};

exports.getDataPoints = function(type, client_id, cb)
{
    var coll = db.collection('datapoints');

    coll.find({ type: type, client_id: client_id }, { sort: [['created', -1]], limit : 30 }).toArray(function(err, docs)
    {
        if (err)
        {
            return cb("Error retrieving data: " + err);
        }

        return cb(null, docs);
    });
};

exports.aggregate = function(start, end, types, client_id, skipCache, cb)
{
    var timeSpan = { from: start, to: end};

    // --------------------------------------------------

    var liveAggregate = function(cb)
    {
        var coll = db.collection('datapoints');

        coll.aggregate
        ([
            {
                $match: {
                    created: { $gte: start, $lt: end },
                    client_id: client_id
                }
            },
            {
                $group:
                {
                    _id: '$type',
                    avg: {$avg: '$data'}
                }
            }
        ]).toArray(function(err, docs)
        {
            logger.info("live aggregation for period " + start + " to " + end + " with " + docs.length + " docs");

            ++queryAggregationCount;
            exports.sendProgress(queryAggregationCount);

            return cb(err, timeSpan, docs);
        });
    };

    // --------------------------------------------------

    var cachedAggregate = function(cb)
    {
        var aggregationpoints = db.collection('aggregationpoints');

        aggregationpoints.aggregate
        ([
            {
                $match: {
                    from: { $gte: start },
                    to: { $lte: end },
                    client_id: client_id
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
            logger.info("cached aggregation for period " + start + " to " + end + " with " + docs.length + " docs");

            ++queryAggregationCount;
            exports.sendProgress(queryAggregationCount);

            return cb(err, timeSpan, docs);
        });
    };

    // --------------------------------------------------

    var interferesWithCurrentHour = function()
    {
        var now = moment();

        //if the current date is within the range of start to end, we need to fetch the data live

        return start < now && end > now;
    };

    // --------------------------------------------------

    if (skipCache)
    {
        logger.info("skipping cache");
        liveAggregate(cb);
    }
    else if (interferesWithCurrentHour())
    {
        logger.info("skipping cache: interferes with current hour");
        liveAggregate(cb);
    }
    else
    {
        logger.info("using cache");
        cachedAggregate(cb);
    }
};

exports.dateDiff = function(from, to)
{
    from = moment(from);
    to = moment(to);

    var diffToStart = to.diff(from, "seconds");

    //logger.info("diff to start from " + from.format("HH:mm:ss") + " to " + to.format("HH:mm:ss") + " : ", diffToStart)

    return diffToStart;
};

exports.aggregation = function(start, end, interval, types, client_id, skipCache, progressCb, cb)
{
    exports.setProgressNotifier(progressCb);
    var dataPointsTemplate = {};

    types.forEach(function(type)
    {
        dataPointsTemplate[type] = [];
    });

    while (start < end)
    {
        var startDate = moment(start).toDate();

        start.add(interval[0], interval[1]);

        //if the start point of the timespan is less than 15 seconds in the past, we
        //skip it. It is very likely that there is no datapoint yet
        var diff = exports.dateDiff(startDate, moment());

        if (diff < 15)
        {
            continue;
        }

        types.forEach(function(type)
        {
            dataPointsTemplate[type].push({
                data: null,
                from: startDate,
                to: moment(start).toDate()
            });
        });
    }

    return exports.aggregateWrapper(dataPointsTemplate, client_id, skipCache, cb);
};

exports.aggregateWrapper = function(dps, client_id, skipCache, cb)
{
    queryAggregationCount = 0;
    var aggregations = [];

    var types = Object.keys(dps);
    var dates = dps[types[0]];

    //logger.info("dpTemplate", dps);

    dates.forEach(function(o)
    {
        aggregations.push(function(cb)
        {
            exports.aggregate(o.from, o.to, types, client_id, skipCache, cb);
        });
    });

    async.parallel(aggregations, function(err, data)
    {
        if (err) throw err;

        var i = -1;
        data.forEach(function(d)
        {
            i++;

            var datapoints = d[1];

            datapoints.forEach(function(e)
            {
                //logger.info("got back datapoints", e);

                var type = e["type"] || e["_id"];

                if (!dps[type])
                {
                    logger.error("unexpected data type", type);
                    return;
                }

                dps[type][i].data = e["avg"];
            });
        });

        logger.info("full data returned");

        return cb(null, dps);
    });
};

exports.getLastCount = function(client_id, cb)
{
    var coll = db.collection('datapoints');

    var count = coll.find({
        client_id: client_id,
        created: { $gte: moment().subtract(10, "minutes").toDate() }
    }, {}).count(function(err, count)
    {
        return cb(err, count);
    });
};

exports.logEntry = function(loglevel, message)
{
    var coll = db.collection('systemlog');

    var logEntry = {
        loglevel: loglevel,
        message: message,
        created: (new Date)
    };

    coll.insertOne(logEntry, function(err, result)
    {
        if (err)
        {
            logger.error("could not store log entry", logEntry, err);
        }
    });
};

exports.fullAggregation = function(cb)
{
    //--------------------------------------------------
    var startTime = new Date();
    var coll = db.collection('datapoints');
    var agg = db.collection('aggregationpoints');
    //don't aggregate anything that is within the current hour
    var overallEnd = moment().startOf("hour");
    //delete all the items with "aggregated: true", that are older than 1h
    //we need this to keep the data points of the last hour for the "2 minutes in last hour" interval query
    var deleteOlderThan = moment().subtract(1, "hour");
    //--------------------------------------------------
    //temp vars that will be set by fetchFirst
    var start = null;
    var end = null;
    //--------------------------------------------------

    var start = function()
    {
        logger.info("##################################################");
        logger.info("processing items until " + overallEnd.format("DD.MM.YYYY HH:mm"));
        agg.createIndex( { from: 1, to: 1, type: 1, client_id: 1 }, { unique: true }, function(err, res)
        {
            if (err)
                return cb("aggregation creating unique index" + err);

            logger.info("created unique index");
            logger.info("--------------------------------------------------");

            fetchFirst();
        });
    };

    //--------------------------------------------------

    var fetchFirst = function()
    {
        logger.info("fetching first item");

        coll.find({ aggregated: null }, { sort: [['created', 1]], limit : 1 }).toArray(function(err, firstDoc)
        {
            if (!firstDoc || !firstDoc[0] || !firstDoc[0].created)
            {
                return cb("No or invalid item found in timespan!" + firstDoc);
            }

            if (err)
            {
                return cb("full aggregation fetch first: " + err);
            }

            var first = moment(firstDoc[0].created);

            logger.info("first doc:", firstDoc);
            logger.info("first date:" + first.format("DD.MM.YYYY HH:mm"));

            start = first.startOf("hour");
            end = moment(first).add(1, "hour");

            if (overallEnd < end)
            {
                return cb(null, "stopping aggregation, because the first element + 1h >= end " + overallEnd.format("DD.MM.YYYY HH:mm"));
            }
            else
            {
                logger.info("--------------------------------------------------");
                removeOld();
            }
        });
    };

    //--------------------------------------------------

    var removeOld = function()
    {
        logger.info("deleting already aggregated items");

        coll.deleteMany({
            aggregated: true,
            created: {$lt: deleteOlderThan.toDate()},
        }, function(err, res)
        {
            if (err)
            {
                return cb("delete aggregation: " + err);
            }

            var log = "deleted " + res.result.n + " too old aggregated datapoints";
            exports.logEntry("info", log);
            logger.info(log);
            logger.info("--------------------------------------------------");

            aggregateHour();
        });
    };

    //--------------------------------------------------

    var aggregateHour = function()
    {
        logger.info("aggregation for hour " + moment(start).format("DD.MM.YYYY HH:mm") + " to " + moment(end).format("DD.MM.YYYY HH:mm"));

        coll.aggregate
        ([
            {
                $match: {
                    created: { $gte: start.toDate(), $lt: end.toDate() },
                    aggregated: null
                }
            },
            {
                $group:
                {
                    _id: {
                        type: '$type',
                        client_id: '$client_id'
                    },
                    avg: {$avg: '$data'}
                }
            }
        ]).toArray(function(err, docs)
        {
            if (err)
            {
                return cb("full aggregation agg: " + err);
            }

            //process aggregation
            var aggregatedDatapoints = [];

            docs.forEach(function(d)
            {
                aggregatedDatapoints.push({
                    type: d["_id"].type,
                    client_id: d["_id"].client_id,
                    avg: d["avg"],
                    created: (new Date),
                    from: start.toDate(),
                    to: end.toDate()
                });
            });

            logger.info("aggregation results: " + aggregatedDatapoints.length + " datapoints");
            logger.info("--------------------------------------------------");

            storeAggregation(aggregatedDatapoints, function()
            {
                flagAggregatedPoints();
            });
        });
    };

    //--------------------------------------------------

    var storeAggregation = function(aggregatedDatapoints, next)
    {
        logger.info("storing aggregation for " + aggregatedDatapoints.length + " datapoints");

        agg.insertMany(aggregatedDatapoints, function(err, res)
        {
            if (err && err.toString().indexOf("duplicate key") === -1)
            {
                return cb("full aggregation storage: " + err);
            }

            logger.info("stored in aggregationpoints: " + aggregatedDatapoints.length + " datapoints");
            logger.info("--------------------------------------------------");

            next();
        });
    };

    //--------------------------------------------------

    var flagAggregatedPoints = function()
    {
        coll.update({
            created: { $gte: start.toDate(), $lt: end.toDate()
        }}, {
            $set: { aggregated: true }
        },  {
            w:1, multi: true
        }, function(err, res)
        {
            if (err)
            {
                return cb("flagged aggregation: " + err);
            }

            var log = "flagged " + res.result.nModified + " datapoints for deletion in next round";
            logger.info(log);
            exports.logEntry("info", log);
            logger.info("--------------------------------------------------");

            roundDone();
        });
    };

    //--------------------------------------------------

    var roundDone = function()
    {
        var timeSpend = ((new Date).getTime() - startTime.getTime()) / 1000;
        var log = "aggregation round done in " + timeSpend + " seconds";
        logger.info(log);
        exports.logEntry("success", log);
        logger.info("next round");
        logger.info("##################################################");
        exports.fullAggregation(cb);
    };

    start();
};