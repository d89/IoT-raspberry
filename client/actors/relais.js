"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;

// ######################################################

class relais extends baseActor
{
    constructor(options)
    {
        super("relais", options);
    }

    exposed()
    {
        return {
            on: {
                method: this.on.bind(this),
                params: []
            },
            off: {
                method: this.off.bind(this),
                params: []
            },
            toggle: {
                method: this.toggle.bind(this),
                params: []
            }
        };
    }

    on(cb)
    {
        this.setRelais("on", this.options.pin, cb);
    }

    off(cb)
    {
        this.setRelais("off", this.options.pin, cb);
    }

    toggle(cb)
    {
        var that = this;

        that.setRelais("on", that.options.pin, function()
        {
            setTimeout(function()
            {
                that.setRelais("off", that.options.pin, cb);
            }, 500);
        });
    }

    setRelais(toState, pin, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        that.logger.info("setting relais on " + pin + " to " + toState);

        var prc = spawn(config.baseBath + '/actors/relais', [ pin, toState ]);
        prc.stdout.setEncoding('utf8');

        prc.stderr.on('data', function (data)
        {
            that.logger.error("received err: ", data.toString());
        });

        prc.stdout.on('data', function (data)
        {
            that.logger.info("received data: ", data);
        });

        cb(null, "relais switch done");
    }
}

module.exports = relais;