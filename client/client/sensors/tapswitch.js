"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class tapswitch extends baseSensor
{
    constructor(options)
    {
        super("tapswitch", false, options);
        this.read();
        this.currentState = false;
    }

    read()
    {
        var that = this;

        that.spawn('tapswitch', [that.options.pin], function ondata(data)
        {
            try
            {
                that.currentState = !that.currentState;
                that.senddata(that.currentState ? 1 : 0, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = tapswitch;