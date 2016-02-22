"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class tapswitch extends baseSensor
{
    constructor(options)
    {
        super("tapswitch", options);
        this.read();
        this.currentState = false;
    }

    read()
    {
        var that = this;

        that.spawn('switch', [], function ondata(data)
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

/*
new tapswitch({
    restartSensorAfter: false,
    onData: function(data)
    {
        console.log(data);
    }
});
*/

module.exports = tapswitch;