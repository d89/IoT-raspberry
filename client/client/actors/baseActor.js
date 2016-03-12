"use strict";

var logger = require('../logger');
var config = require("../config");

// ######################################################

class baseActor
{
    constructor(name, options)
    {
        this.logger = logger;
        this.options = options;
        this.name = name;
        this.logger.info(`actor ${this.name} registered`);
    }
}

module.exports = baseActor;