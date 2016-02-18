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
        this.sensordata = {
            was: null,
            is: null
        };
        this.name = name;
        this.logger.info(`watching ${this.name}`);
    }

    processCondition(triggered)
    {
        //don't pay respect to the trigger, when we have null data
        if (this.sensordata.is === null || this.sensordata.was === null)
        {
            return false;
        }

        /*
        if (this.name === "time")
        {
            console.log("for " + this.name);
            console.log("- check is", this.sensordata.is);
            console.log("- check was", this.sensordata.was);
            console.log("##########");
        }
        */

        if (triggered) //reset
        {
            this.sensordata.was = this.sensordata.is;
        }

        return triggered;
    }

    exposed()
    {
        var that = this;

        return {
            is_equal: function(val)
            {
                var triggered = (that.sensordata.is == val);
                return that.processCondition(triggered);
            },
            is_lt: function(val)
            {
                var triggered = (that.sensordata.is < val);
                return that.processCondition(triggered);
            },
            is_gt: function(val)
            {
                var triggered = (that.sensordata.is > val);
                return that.processCondition(triggered);
            },
            became_equal: function(val)
            {
                var triggered = (that.sensordata.is == val && that.sensordata.was != val);
                return that.processCondition(triggered);
            },
            became_gt: function(val)
            {
                var triggered = (that.sensordata.is > val && !(that.sensordata.was > val));
                return that.processCondition(triggered);
            },
            became_lt: function(val)
            {
                var triggered = (that.sensordata.is < val && !(that.sensordata.was < val));
                return that.processCondition(triggered);
            }
        }
    }

    senddata(data, sender)
    {
        this.sensordata.was = this.sensordata.is;
        this.sensordata.is = data;

        this.options.onData(this.name, data);
    }

    spawn(path, params, ondata, onerror, onclose)
    {
        path = config.baseBath + "/sensors/" + path;
        var restartAfter = this.options.restartSensorAfter !== undefined ? this.options.restartSensorAfter : config.restartSensorAfter;
        return processmanager.spawn(path, params, restartAfter, ondata, onerror, onclose);
    }

}

module.exports = baseSensor;