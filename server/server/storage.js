var MongoClient = require('mongodb').MongoClient;
var moment = require("moment");
var async = require("async");
var logger = require("winston");
var db = null;
var queryAggregationCount = 0;
var globalCache = [];
var progressNotifier = null;

exports.setDatabase = function(database)
{
    db = database;

    /*
    var coll = db.collection('datapoints');
    coll.update({}, {$set: {client_id:"Davids IoT-Raspberry"}},{w:1, multi: true}, function(err, res)
    {
        logger.info("!!!!!!!!!!!!!!!", err);
    });
    */
};

exports.setProgressNotifier = function(cb)
{
    progressNotifier = cb;
};

exports.sendProgress = function(data)
{
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

exports.aggregate = function(start, end, types, client_id, cb)
{
    var timeSpan = { from: start, to: end};

    // --------------------------------------------------

    var agg = function(cb)
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
            ++queryAggregationCount;

            exports.sendProgress(queryAggregationCount);

             if (docs)
             {
                 var cache = docs.slice();

                 for (var i = 0; i < cache.length; i++)
                 {
                     cache[i].type = cache[i]['_id'];
                     delete cache[i]['_id'];
                     cache[i].from = start;
                     cache[i].to = end;
                     cache[i].client_id = client_id;
                 }

                 exports.saveForCache(cache);
             }

            return cb(err, timeSpan, docs);
        });
    };

    // --------------------------------------------------

    var aggregation = db.collection('aggregation');

    aggregation.find({
        from: start,
        to: end,
        client_id: client_id
    }).toArray(function(err, docs)
    {
        var fromCache = [];

        if (docs)
        {
            //should look like this:
            // [ {
            //     avg: 84.97765363128492,
            //     type: 'soundvol',
            //     from: Sat Jan 16 2016 20:00:00 GMT+0100 (CET),
            //     to: Sat Jan 16 2016 21:00:00 GMT+0100 (CET)
            //    },
            //    { ... }
            // ]

            docs.forEach(function(d)
            {
                fromCache.push({
                    avg: d.avg,
                    type: d.type,
                    from: d.from,
                    to: d.to
                });
            });

            //logger.info("from cache", fromCache);

            if (fromCache.length > 0)
            {
                logger.info("cache is filled");
                return cb(err, timeSpan, fromCache);
            }
            else
            {
                logger.info("cache is empty, getting from live");
                agg(cb);
            }
        }
        else
        {
            logger.info("cache is empty, getting from live");
            agg(cb);
        }
    });
};

exports.saveForCache = function(cache)
{
    cache.forEach(function(c)
    {
        globalCache.push(c);
    });
}

exports.storeInCache = function()
{
    logger.info("storing in cache: " + globalCache.length + " items");

    //TODO
    return;

    var aggregation = db.collection('aggregation');

    aggregation.insertMany(globalCache, function(err, res)
    {
        logger.info("stored in cache!");
    });
};

exports.aggregateDaysOfMonth = function(types, client_id, progressCb, cb)
{
    exports.setProgressNotifier(progressCb);
    var dataPointsTemplate = {};

    types.forEach(function(type)
    {
        dataPointsTemplate[type] = [];
    });

    var end = moment();
    var start = moment().subtract(30, 'days').startOf("day");

    while (start < end)
    {
        var startDate = moment(start).toDate();
        start.add(1, 'day');

        types.forEach(function(type)
        {
            dataPointsTemplate[type].push({
                data: null,
                from: startDate,
                to: moment(start).toDate()
            });
        });
    }

    return exports.fullAggregation(dataPointsTemplate, client_id, cb);
};

exports.aggregateLastHour = function(types, client_id, progressCb, cb)
{
    exports.setProgressNotifier(progressCb);
    var dataPointsTemplate = {};

    types.forEach(function(type)
    {
        dataPointsTemplate[type] = [];
    });

    var end = moment();
    var start = moment().subtract(1, 'hour');

    while (start < end)
    {
        var startDate = moment(start).toDate();
        start.add(2, 'minute');

        types.forEach(function(type)
        {
            dataPointsTemplate[type].push({
                data: null,
                from: startDate,
                to: moment(start).toDate()
            });
        });
    }

    return exports.fullAggregation(dataPointsTemplate, client_id, cb);
};

exports.aggregateHoursOfDay = function(types, client_id, progressCb, cb)
{
    exports.setProgressNotifier(progressCb);
    var dataPointsTemplate = {};

    types.forEach(function(type)
    {
        dataPointsTemplate[type] = [];
    });

    var end = moment();
    var start = moment().subtract(24, 'hours').startOf("hour");

    while (start < end)
    {
        var startDate = moment(start).toDate();
        start.add(1, 'hour');

        types.forEach(function(type)
        {
            dataPointsTemplate[type].push({
                data: null,
                from: startDate,
                to: moment(start).toDate()
            });
        });
    }

    return exports.fullAggregation(dataPointsTemplate, client_id, cb);
};

exports.fullAggregation = function(dps, client_id, cb)
{
    globalCache = [];
    queryAggregationCount = 0;
    var aggregations = [];

    var types = Object.keys(dps);
    var dates = dps[types[0]];

    //logger.info("dpTemplate", dps);

    dates.forEach(function(o)
    {
        aggregations.push(function(cb)
        {
            exports.aggregate(o.from, o.to, types, client_id, cb);
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

        exports.storeInCache();
        //logger.info("full data returned", dps);

        return cb(null, dps);
    });
};
