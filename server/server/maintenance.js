var logger = require("./logger");
var storage = require("./storage");
var async = require("async");
var moment = require("moment");

exports.info = function(onfinished)
{
    var db = storage.getDatabase();

    //last aggregated datapoint
    var aggregationpoints = db.collection('aggregationpoints');
    var datapoints = db.collection('datapoints');
    var systemlog = db.collection('systemlog');

    async.series
    ({
        lastAggregatedDatapoint: function(cb)
        {
            aggregationpoints.find({}, { sort: [['to', -1]], limit : 1 }).toArray(function(err, docs)
            {
                return cb(err, docs);
            });
        },
        // --------------------------------------------------------------------------
        firstDatapoint: function(cb)
        {
            datapoints.find({}, { sort: [['created', 1]], limit : 1 }).toArray(function(err, docs)
            {
                return cb(err, docs);
            });
        },
        // --------------------------------------------------------------------------
        aggregationCount: function(cb)
        {
            aggregationpoints.count(function(err, count)
            {
                return cb(err, count);
            });
        },
        // --------------------------------------------------------------------------
        datapointCount: function(cb)
        {
            datapoints.count(function(err, count)
            {
                return cb(err, count);
            });
        },
        // --------------------------------------------------------------------------
        systemLog: function(cb)
        {
            systemlog.find({}, { sort: [['created', -1]], limit : 20 }).toArray(function(err, docs)
            {
                return cb(err, docs);
            });
        }
    },
    function(err, results)
    {
        if (err)
        {
            return onfinished(err);
        }

        var retval = [];

        //----------------------------------------------------

        var lastAgg = results.lastAggregatedDatapoint[0];
        retval.push({
            type: "Last Aggregated Datapoint",
            time: moment(lastAgg.created).format("DD.MM. HH:mm"),
            text: "For end time " + moment(lastAgg.to).format("DD.MM. HH:mm") + " and client '" + lastAgg.client_id  + "'"
        });

        //----------------------------------------------------

        var firstDatapoint = results.firstDatapoint[0];
        retval.push({
            type: "First Datapoint",
            time: moment(firstDatapoint.created).format("DD.MM. HH:mm"),
            text: "For data type '" + firstDatapoint.type + "' and client '" + firstDatapoint.client_id + "'"
        });

        //----------------------------------------------------

        var aggCount = results.aggregationCount;

        retval.push({
            type: "Aggregated Datapoint Count",
            time: moment().format("DD.MM. HH:mm"),
            text: aggCount + " aggregated datapoints total"
        });

        //----------------------------------------------------

        var dpCount = results.datapointCount;

        retval.push({
            type: "Datapoint Count",
            time: moment().format("DD.MM. HH:mm"),
            text: dpCount + " datapoints total"
        });

        //----------------------------------------------------

        var syslog = [];

        results.systemLog.forEach(function(s)
        {
           syslog.push({
                created: moment(s.created).format("DD.MM. HH:mm"),
                loglevel: s.loglevel,
                message: s.message
           });
        });

        return onfinished(null, retval, syslog);
    });
};