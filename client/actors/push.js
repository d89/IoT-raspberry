"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var socketmanager = require('../socketmanager');

// ######################################################

class push extends baseActor
{
    constructor(options)
    {
        super("push", options);
    }

    exposed()
    {
        return {
            push: {
                method: this.push.bind(this),
                params: []
            }
        };
    }

    push(cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("pushed", err, resp);
        };

        socketmanager.socket.emit("client:push", {}, function(err, msg)
        {
            cb(err, msg);
        });
    }
}

module.exports = push;