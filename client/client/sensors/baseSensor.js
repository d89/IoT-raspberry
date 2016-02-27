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
        this.triggerMap = {};
        this.triggerMapTemp = {};
    }

    shouldTrigger(method, triggered)
    {
        var shouldTrigger = false;

        //only trigger once. Every other trigger for the same condition is ignored
        if (method in this.triggerMap)
        {
            var currentState = this.triggerMap[method];

            if (!currentState && triggered) {
                //logger.info("Succint Activatation trigger for " + this.name + "." + method);
                shouldTrigger = true;
            } else {
                //this is the interesting part, where the "retrigger" would happen
                //logger.info("Skipping Repeated Activatation trigger for " + this.name + "." + method);
                shouldTrigger = false;
            }
        } else {
            if (triggered) {
                //logger.info("First Activatation trigger for " + this.name + "." + method);
                shouldTrigger = true;
            } else {
                shouldTrigger = false;
            }
        }

        this.triggerMapTemp[method] = triggered;

        return shouldTrigger;
    }

    processCondition(method, param, triggered)
    {
        //don't pay respect to the trigger, when we have null data
        if (this.sensordata.is === null)
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

        var signature = method + "(" + param + ")";

        return this.shouldTrigger(signature, triggered);
    }

    setResult(methodName)
    {
        //console.log("\tsetting result for round end with " + this.name + "." + methodName);

        //copy object
        this.triggerMap = JSON.parse(JSON.stringify(this.triggerMapTemp));
    }

    exposed()
    {
        var that = this;

        return {
            is_equal:
            {
                method: function(val)
                {
                    var triggered = (that.sensordata.is == val);
                    return that.processCondition("is_equal", val, triggered);
                },
                setResult: function()
                {
                    that.setResult("is_equal");
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
                    var triggered = (that.sensordata.is < val);
                    return that.processCondition("is_lt", val, triggered);
                },
                setResult: function()
                {
                    that.setResult("is_lt");
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
                    var triggered = (that.sensordata.is > val);
                    return that.processCondition("is_gt", val, triggered);
                },
                setResult: function()
                {
                    that.setResult("is_gt");
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
        var restartAfter = this.options.restartSensorAfter !== undefined ? this.options.restartSensorAfter : config.restartSensorAfter;
        return processmanager.spawn(path, params, restartAfter, ondata, onerror, onclose);
    }

}

module.exports = baseSensor;