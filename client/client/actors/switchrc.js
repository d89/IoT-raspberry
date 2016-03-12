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

    switch1on()
    {
        this.turnSwitch(1, 1, 1);
    }

    switch1off()
    {
        this.turnSwitch(1, 1, 0);
    }

    switch2on()
    {
        this.turnSwitch(1, 2, 1);
    }

    switch2off()
    {
        this.turnSwitch(1, 2, 0);
    }

    switch3on()
    {
        this.turnSwitch(1, 3, 1);
    }

    switch3off()
    {
        this.turnSwitch(1, 3, 0);
    }

    turnSwitch(channel, device, state)
    {
        var that = this;

        that.logger.info(`switching rc plug: channel ${channel}, device ${device}, state ${state}`);
        var prc = spawn(config.baseBath + '/actors/switchrc', [channel, device, state]);
        prc.stdout.setEncoding('utf8');

        prc.stderr.on('data', function (data)
        {
            that.logger.error("received err: ", data.toString());
        });

        prc.stdout.on('data', function (data)
        {
            that.logger.info("received data: ", data);
        });
    };
}

module.exports = switchrc;