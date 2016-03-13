"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;

// ######################################################

class switchrc extends baseActor
{
    constructor(options)
    {
        super("switchrc", options);
    }

    exposed()
    {
        return {
            switch1on: {
                method: this.switch1on.bind(this),
                params: []
            },
            switch2on: {
                method: this.switch2on.bind(this),
                params: []
            },
            switch3on: {
                method: this.switch3on.bind(this),
                params: []
            },
            switch1off: {
                method: this.switch1off.bind(this),
                params: []
            },
            switch2off: {
                method: this.switch2off.bind(this),
                params: []
            },
            switch3off: {
                method: this.switch3off.bind(this),
                params: []
            }
        };
    }

    // ---------------------------------------------------

    switch1on(cb)
    {
        this.turnSwitch(1, 1, 1, cb);
    }

    switch1off(cb)
    {
        this.turnSwitch(1, 1, 0, cb);
    }

    switch2on(cb)
    {
        this.turnSwitch(1, 2, 1, cb);
    }

    switch2off(cb)
    {
        this.turnSwitch(1, 2, 0, cb);
    }

    switch3on(cb)
    {
        this.turnSwitch(1, 3, 1, cb);
    }

    switch3off(cb)
    {
        this.turnSwitch(1, 3, 0, cb);
    }

    turnSwitch(channel, device, state, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        that.logger.info(`switching rc plug: channel ${channel}, device ${device}, state ${state}`);
        var prc = spawn(config.baseBath + '/actors/switchrc', [channel, device, state]);
        prc.stdout.setEncoding('utf8');

        prc.stderr.on('data', function (data)
        {
            cb(data.toString());
        });

        prc.stdout.on('data', function (data)
        {
            cb(null, data.toString());
        });
    };
}

module.exports = switchrc;