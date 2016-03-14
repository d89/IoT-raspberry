"use strict";

var baseSensor = require("./baseSensor");
var request = require('request');

// ######################################################

class httplistener extends baseSensor
{
    constructor(options)
    {
        super("httplistener", false, options);

        var that = this;
        that.url = null;

        setInterval(function()
        {
            that.read();
        }, that.options.interval * 1000);
    }

    exposed(val)
    {
        var that = this;

        var exposedMethods = [];

        exposedMethods["contains"] =
        {
            method: function(url, val)
            {
                that.url = url;

                if (!that.validateDataPresence()) return false;

                var currentValue = that.sensordata.is;
                var triggered = (currentValue.indexOf(val) !== -1);

                /*
                if (triggered)
                    that.logger.info("web page: " + that.url + " contains " + val)
                */

                return that.processCondition("contains", val, triggered);
            },
            params: [{
                name: "url",
                isOptional: false,
                dataType: "string",
                notes: "The url to be requested"
            },{
                name: "val",
                isOptional: false,
                dataType: "string",
                notes: "The text to be contained on the web page"
            }]
        };

        return exposedMethods;
    }

    read()
    {
        var that = this;
        if (!that.url) return;
        //that.logger.info("requesting " + that.url);

        request.get(that.url, function (error, response, body)
        {
            if (error)
            {
                that.logger.error(error + " for " + that.url);
            }
            else if (response && response.statusCode && response.statusCode != 200)
            {
                that.logger.error("status code " + response.statusCode + " for " + that.url);
            }
            else //success
            {
                //that.logger.info("received " + body.length + " chars for " + that.url);
                that.senddata(body.toString(), this);
            }
        });
    }

    // ----------------------------------------------
}

module.exports = httplistener;