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

    expose()
    {
        var that = this;

        return {
            is: function()
            {
                return that.sensordata ? that.sensordata.is : null;
            },
            was: function()
            {
                return that.sensordata ? that.sensordata.was : null;
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