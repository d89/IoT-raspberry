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
        console.log("for " + this.name);
        console.log("- check is", this.sensordata.is);
        console.log("- check was", this.sensordata.was);
        console.log("##########");
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
            is: function(val)
            {
                var triggered = (that.sensordata.is == val);
                return that.processCondition(triggered);
            },
            was: function(val)
            {
                var triggered = (that.sensordata.was == val);
                return that.processCondition(triggered);
            },
            lte: function(val)
            {
                var triggered = (that.sensordata.is <= val);
                return that.processCondition(triggered);
            },
            lt: function(val)
            {
                var triggered = (that.sensordata.is < val);
                return that.processCondition(triggered);
            },
            gte: function(val)
            {
                var triggered = (that.sensordata.is >= val);
                return that.processCondition(triggered);
            },
            gt: function(val)
            {
                var triggered = (that.sensordata.is > val);
                return that.processCondition(triggered);
            },
            became: function(val)
            {
                var triggered = (that.sensordata.is == val && that.sensordata.was != val);
                return that.processCondition(triggered);
            },
            becamegt: function(val)
            {
                var triggered = (that.sensordata.is > val && !(that.sensordata.was > val));
                return that.processCondition(triggered);
            },
            becamegte: function(val)
            {
                var triggered = (that.sensordata.is >= val && !(that.sensordata.was >= val));
                return that.processCondition(triggered);
            },
            becamelt: function(val)
            {
                var triggered = (that.sensordata.is < val && !(that.sensordata.was < val));
                return that.processCondition(triggered);
            },
            becamelte: function(val)
            {
                var triggered = (that.sensordata.is <= val && !(that.sensordata.was <= val));
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
        return processmanager.spawn(path, params, ondata, onerror, onclose);
    }

}

module.exports = baseSensor;