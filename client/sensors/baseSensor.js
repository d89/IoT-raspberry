"use strict";

var logger = require('../logger');
var processmanager = require("../processmanager");
var config = require("../config");

// ######################################################

class baseSensor
{
    constructor(name, description, options)
    {
        this.logger = logger;
        this.options = options;
        this.sensordata = {
            was: null,
            is: null
        };
        this.name = name;
        this.description = description;
        //if no description is given, we don't want to send & store this datapoint on the server
        //examples contain sensor values that should just locally (time, date) for condition parsing,
        //but are of no relevance for the server
        this.sendToServer = this.description !== false;
        this.logger.info(`watching ${this.name}`);
    }

    processCondition(method, param, triggered)
    {
        //don't pay respect to the trigger, when we have null data
        if (this.sensordata.is === null)
        {
            return false;
        }

        if (triggered) //reset
        {
            this.sensordata.was = this.sensordata.is;
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

        return triggered;
    }

    //check if all the dependencies are fulfilled.
    //can be overridden in the concrete class.
    dependenciesFulfilled()
    {
        return true;
    }

    validateDataPresence()
    {
        return this.sensordata
            && this.sensordata.is != null
            && typeof this.sensordata.is != "undefined"
            && this.sensordata.was != null
            && typeof this.sensordata.was != "undefined";
    }

    exposed()
    {
        var that = this;

        return {
            is_equal:
            {
                method: function(val)
                {
                    if (!that.validateDataPresence()) return false;

                    val = parseFloat(val, 10);
                    var sensordata = parseFloat(that.sensordata.is, 10);

                    var triggered = (sensordata == val);
                    return that.processCondition("is_equal", val, triggered);
                },
                params: [{
                    name: "val",
                    isOptional: false,
                    dataType: "integer",
                    notes: "The current value of the sensor"
                }]
            },
            // -------------------------------------------------
            is_lt:
            {
                method: function(val)
                {
                    if (!that.validateDataPresence()) return false;

                    val = parseFloat(val, 10);
                    var sensordata = parseFloat(that.sensordata.is, 10);

                    var triggered = (sensordata < val);
                    return that.processCondition("is_lt", val, triggered);
                },
                params: [{
                    name: "val",
                    isOptional: false,
                    dataType: "integer",
                    notes: "The current value of the sensor"
                }]
            },
            // -------------------------------------------------
            is_gt:
            {
                method: function(val)
                {
                    if (!that.validateDataPresence()) return false;

                    val = parseFloat(val, 10);
                    var sensordata = parseFloat(that.sensordata.is, 10);

                    var triggered = (sensordata > val);
                    return that.processCondition("is_gt", val, triggered);
                },
                params: [{
                    name: "val",
                    isOptional: false,
                    dataType: "integer",
                    notes: "The current value of the sensor"
                }]
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
        var restartSensorAfter = this.options.restartSensorAfter !== undefined ? this.options.restartSensorAfter : config.restartSensorAfter;
        return processmanager.spawn(path, params, restartSensorAfter, ondata, onerror, onclose);
    }

}

module.exports = baseSensor;