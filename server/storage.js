var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = new require('mongoose').Types.ObjectId;

var scheme = new Schema({
    AutoId	 : Number,
	type     : String,
    data     : Number,
    created  : { type: Date, default: Date.now }
});
var DataPoint = mongoose.model('DataPoint', scheme);


exports.persistDataPoint = function(type, data, cb)
{
	type = type || "temperature";
	data = data || 0;
	cb = cb || function() {};
	
	var dp = new DataPoint;
	dp.type = type;
	dp.data = data;
	dp.save(cb);
	
	return dp;
};

exports.getDataPoints = function(type, startFrom, cb)
{
	if (!startFrom || startFrom.length !== 24)
	{
		startFrom = new ObjectId("0".repeat(24));
	}
	else
	{
		startFrom = new ObjectId(startFrom);
	}
	
	DataPoint
		.find({ type: type, _id: { $gt: startFrom }})
		.sort({created: -1})
		.limit(30)
		.exec(function(err, docs) 
	{
		if (err)
		{
			console.log("Error retrieving data");
			docs = [];
		}
		
		return cb(docs);
	});
};