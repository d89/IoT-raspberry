var winston = require("winston");

var logger = new (winston.Logger)({
    level: 'verbose',
    transports: [
        new (winston.transports.Console)({ json: false, timestamp: true }),
        new (winston.transports.File)({ filename: '../logs/logfile.log' })
    ],
    exitOnError: true
});

module.exports = logger;