"use strict";

var baseSensor = require("./baseSensor");

// ######################################################

class lightintensity extends baseSensor
{
    constructor(options)
    {
        super("lightintensity", options);
        this.read();
    }

    read()
    {
        var that = this;

        that.spawn('pcf8591', [], function ondata(data)
        {
            try
            {
                data = JSON.parse(data.toString()).light;
                data = that.transformLightValue(parseFloat(data, 10));
                that.senddata(data, that);
            }
            catch (err)
            {
                that.logger.error(err, data);
            }
        });
    }

    // ----------------------------------------------

    transformLightValue(lightValue)
    {
        //value is always between ~oldMaxLight (super light) and 255 (complete darkness)
        var oldMaxLight = 170;

        //value is now between
        // 0 -> super light
        // (255 - oldMaxLight) -> complete darkness
        lightValue = lightValue - oldMaxLight;

        //no negative numbers in case of "too light"
        if (lightValue < 0)
        {
            lightValue = 0;
        }

        //invert:
        //value is now between
        // (255 - oldMaxLight) -> complete darkness
        // 255 -> super light
        lightValue = 255 - lightValue;

        lightValue = lightValue - oldMaxLight;

        lightValue = 100 * (lightValue / (255 - oldMaxLight));

        return lightValue;
    }
}

module.exports = lightintensity;