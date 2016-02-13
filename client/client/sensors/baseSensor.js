"use strict";

var logger = require('../logger');
var processmanager = require("../processmanager");
var config = require("../config");

// ######################################################

class baseSensor
{
    constructor(name, options)
    {
        this.logger = logger;
        this.options = options;
        this.sensordata = null;
        this.name = name;
        this.logger.info(`watching ${this.name}`);
    }

    exposed()
    {
        var that = this;

        return {
            is: function(val)
            {
                if (!that.sensordata) return false;
                return that.sensordata.is == val;
            },
            lte: function(val)
            {
                if (!that.sensordata) return false;
                return that.sensordata.is <= val;
            },
            lt: function(val)
            {
                if (!that.sensordata) return false;
                return that.sensordata.is < val;
            },
            gte: function(val)
            {
                if (!that.sensordata) return false;
                return that.sensordata.is >= val;
            },
            gt: function(val)
            {
                if (!that.sensordata) return false;
                return that.sensordata.is > val;
            }
        }
    }

    senddata(data, sender)
    {
        if (this.sensordata)
        {
            this.sensordata.was = this.sensordata.is;
            this.sensordata.is = data;
        }
        else
        {
            this.sensordata = {
                was: null,
                is: data
            };
        }

        this.options.onData(this.name, data);
    }

    spawn(path, params, ondata, onerror, onclose)
    {
        path = config.baseBath + "/sensors/" + path;
        return processmanager.spawn(path, params, ondata, onerror, onclose);
    }

}

module.exports = baseSensor;