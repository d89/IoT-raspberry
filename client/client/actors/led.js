var logger = require('../logger');
var config = require('../config');
var spawn = require('child_process').spawn;

exports.exposed = function()
{
    return {
        red: {
            method: exports.red,
            params: []
        },
        green: {
            method: exports.green,
            params: []
        }
    };
};

exports.red = function()
{
    exports.act(40);
};

exports.green = function()
{
    exports.act(13);
};

exports.act = function(pin)
{
    logger.info("blinking LED PIN " + pin);

    var prc = spawn(config.baseBath + '/actors/led', [ pin ]);
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