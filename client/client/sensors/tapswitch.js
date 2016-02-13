"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class tapswitch extends baseSensor
{
    constructor(options)
    {
        super("tapswitch", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('switch', [], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).stateChange;
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }
}

module.exports = tapswitch;