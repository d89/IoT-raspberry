var winston = require("winston");
var moment = require("moment");
var config = require("./config");

var logger = new (winston.Logger)
({
    level: 'verbose',
    transports: [
        new (winston.transports.Console)
        ({
            json: false,
            colorize: true,
            level: 'debug',
            prettyPrint: true,
            timestamp: function()
            {
                return moment().toISOString();
            }}),
        new (winston.transports.File)
        ({
            filename: config.logFile,
            maxFiles: 1,
            level: 'debug',
            maxsize: 200 * 1024 * 1024, //1mb
            timestamp: function()
            {
                return moment().toISOString();
            }
        })
    ],
    exitOnError: true
});

module.exports = logger;