'use strict';

var constants = angular.module('IoTConstants', []);

constants.provider('constant', function()
{
    var config =
    {
        serverUrl: 'https://d1303.de:3000',
        dataTypes: [
            {
                id: "temperature",
                label: "Temperature (°C)"
            },
            {
                id: "cputemp",
                label: "CPU Temperature (°C)"
            },
            {
                id: "mem",
                label: "Memory Usage (%)"
            },
            {
                id: "load",
                label: "CPU Load"
            },
            {
                id: "humidity",
                label: "Humidity (%)"
            },
            {
                id: "distance",
                label: "Distance (m)"
            },
            {
                id: "lightintensity",
                label: "Light Intensity"
            },
            {
                id: "light",
                label: "Light State"
            },
            {
                id: "soundvol",
                label: "Sound Volume"
            },
            {
                id: "sound",
                label: "Sound State"
            },
            {
                id: "movement1",
                label: "Movement (sensor 1)"
            },
            {
                id: "movement2",
                label: "Movement (sensor 2)"
            }
        ]
    };

    this.$get = function()
    {
        return function(name)
        {
            return config[name];
        };
    };
});