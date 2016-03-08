var logger = require('../logger');
var process = null;
var spawn = require('child_process').spawn;
var config = require('../config');

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

function setServo(state)
{
    if (process)
    {
        logger.info("disabling servo");
        process.kill();
        process = null;
    }

    if (state === false)
    {
        return;
    }

    logger.info("enabling servo");

    process = spawn(config.baseBath + '/actors/servo',  []);
    process.stdout.setEncoding('utf8');

    process.stderr.on('data', function (data)
    {
        logger.error("received err: ", data.toString());
    });

    process.stdout.on('data', function (data)
    {
        logger.info("received data: ", data);
    });
}

exports.on = function()
{
   setServo(true);
};

exports.off = function()
{
    setServo(false);
};