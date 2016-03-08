var logger = require('../logger');
var config = require('../config');

exports.exposed = function()
{
    return {
        switch1on: {
            method: exports.switch1on,
            params: []
        },
        switch2on: {
            method: exports.switch2on,
            params: []
        },
        switch3on: {
            method: exports.switch3on,
            params: []
        },

        switch1off: {
            method: exports.switch1off,
            params: []
        },
        switch2off: {
            method: exports.switch2off,
            params: []
        },
        switch3off: {
            method: exports.switch3off,
            params: []
        }
    };
};

exports.switch1on = function()
{
    exports.turnSwitch(1, 1, 1);
};

exports.switch1off = function()
{
    exports.turnSwitch(1, 1, 0);
};

exports.switch2on = function()
{
    exports.turnSwitch(1, 2, 1);
};

exports.switch2off = function()
{
    exports.turnSwitch(1, 2, 0);
};

exports.switch3on = function()
{
    exports.turnSwitch(1, 3, 1);
};

exports.switch3off = function()
{
    exports.turnSwitch(1, 3, 0);
};


exports.turnSwitch = function(channel, device, state)
{
    logger.info(`switching rc plug: channel ${channel}, device ${device}, state ${state}`);
    var spawn = require('child_process').spawn;
    var prc = spawn(config.baseBath + '/actors/switchrc', [channel, device, state]);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    prc.stdout.on('data', function (data)
    {
        logger.info("received data: ", data);
    });
};

//exports.switch(1, 1, 0);