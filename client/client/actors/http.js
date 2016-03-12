"use strict";

var request = require('request');
var querystring = require('querystring');
var baseActor = require("./baseActor");
var config = require('../config');

// ######################################################

class http extends baseActor
{
    constructor(options)
    {
        super("http", options);
    }

    exposed()
    {
        return {
            get: {
                method: this.get.bind(this),
                params: [{
                    name: "url",
                    isOptional: false,
                    dataType: "string",
                    notes: "The full url to be requested"
                }, {
                    name: "parameterstring",
                    isOptional: true,
                    dataType: "string",
                    notes: "the=url&query=string&without=questionmark"
                }]
            },
            post: {
                method: this.post.bind(this),
                params: [{
                    name: "url",
                    isOptional: false,
                    dataType: "string",
                    notes: "The full url to be requested"
                }, {
                    name: "parameterstring",
                    isOptional: true,
                    dataType: "string",
                    notes: "the=url&query=string&without=questionmark"
                }]
            }
        };
    }

    get(url, paramstring)
    {
        var that = this;

        var cb = cb || function(err, resp)
        {
            that.logger.info("got for get", err, resp);
        };

        if (paramstring)
        {
            url = url + "?" + paramstring;
        }

        request.get(url, function (error, response, body)
        {
            if (error)
            {
                cb(error + " for " + url);
            }
            else if (response && response.statusCode && response.statusCode != 200)
            {
                cb("status code " + response.statusCode + " for " + url);
            }
            else //success
            {
                cb(null, "received " + body.length + " chars for " + url);
            }
        });
    }

    post(url, paramstring)
    {
        var that = this;

        var cb = cb || function(err, resp)
        {
            that.logger.info("got for get", err, resp);
        };

        request.post({
            url: url,
            form: querystring.parse(paramstring)
        }, function (error, response, body)
        {
            if (error)
            {
                cb(error + " for " + url);
            }
            else if (response && response.statusCode && response.statusCode != 200)
            {
                cb("status code " + response.statusCode + " for " + url);
            }
            else //success
            {
                cb(null, "received " + body.length + " chars for " + url);
            }
        });
    }
}

module.exports = http;