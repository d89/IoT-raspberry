var logger = require('../logger');
var spawn = require('child_process').spawn;
var config = require('../config');

exports.process = null;

exports.exposed = function()
{
    return {
        on: {
            method: exports.on,
            params: []
        },
        off: {
            method: exports.off,
            params: []
        }
    };
};

function setStepper(state)
{
    if (exports.process)
    {
        exports.process.kill();
        exports.process = null;
    }

    var params = state === true ? [] : ["off"];
    exports.process = spawn(config.baseBath + '/actors/stepper', params);
    exports.process.stdout.setEncoding('utf8');

    exports.process.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    exports.process.stdout.on('data', function (data)
    {
        logger.info("received data: ", data);
    });
};

exports.off = function()
{
    logger.info("disabling stepper");
    setStepper(false);
};

exports.on = function()
{
    logger.info("enabling stepper");
    setStepper(true);
};