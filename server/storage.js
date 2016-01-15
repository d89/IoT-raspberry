var MongoClient = require('mongodb').MongoClient;
var moment = require("moment");
var async = require("async");
var db = null;
var queryAggregationCount = 0;

exports.setDatabase = function(database)
{
    db = database;
};

exports.persistDataPoint = function(type, data, cb)
{
    var dp = {
        type: type,
        data: parseFloat(data, 10),
        created: (new Date)
    };

    db.collection('datapoints').insertOne(dp, function(err, result)
    {
        if (err) throw err;

        //console.log("inserted", dp);

        return cb(dp);
    });
};

exports.getDataPoints = function(type, cb)
{
    var coll = db.collection('datapoints');

    coll.find({ type: type }, { sort: [['created', -1]], limit : 30 }).toArray(function(err, docs)
    {
        if (err)
        {
            console.log("Error retrieving data", err);
            docs = [];
        }

        return cb(docs);
    });
};

exports.aggregate = function(start, end, cb)
{
    var coll = db.collection('datapoints');

    coll.aggregate
    ([
        {
            $match: {
                created: { $gte: start, $lt: end }
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
        console.log(++queryAggregationCount);
        var timeSpan = { from: start, to: end};

        return cb(err, timeSpan, docs);
    });
};

exports.aggregateDaysOfMonth = function(types, cb)
{
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

    return exports.fullAggregation(dataPointsTemplate, cb);
};

exports.aggregateLastHour = function(types, cb)
{
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

    return exports.fullAggregation(dataPointsTemplate, cb);
};

exports.aggregateHoursOfDay = function(types, cb)
{
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

    return exports.fullAggregation(dataPointsTemplate, cb);
};

exports.fullAggregation = function(dps, cb)
{
    queryAggregationCount = 0;
    var aggregations = [];

    var keys = Object.keys(dps);
    var dates = dps[keys[0]];

    dates.forEach(function(o)
    {
        aggregations.push(function(cb)
        {
            exports.aggregate(o.from, o.to, cb);
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
                var type = e["_id"]; //temperature or movement2

                if (!dps[type])
                {
                    console.error("unexpected data type", type);
                    return;
                }

                dps[type][i].data = e["avg"];
            });
        });

        return cb(null, dps);
    });
};
