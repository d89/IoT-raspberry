'use strict';

var constants = angular.module('IoTConstants', []);

constants.provider('constant', function()
{
    var config =
    {
        serverUrl: 'https://d1303.de:3000',
        chartTypeTranslations: {
            "temperature": "Temperature (°C)",
            "cputemp": "CPU Temperature (°C)",
            "mem": "Memory Usage (%)",
            "load": "CPU Load",
            "humidity": "Humidity (%)",
            "distance": "Distance (cm)",
            "lightintensity": "Light Intensity",
            "light": "Light State",
            "soundvol": "Sound Volume",
            "sound": "Sound State",
            "movement1": "Movement (sensor 1)",
            "movement2": "Movement (sensor 2)",
            "poti": "Potentiometer"
        }
    };

    this.$get = function()
    {
        return {
            set: function(name, value)
            {
                config[name] = value;
            },
            get: function(name)
            {
                return config[name];
            }
        }
    };
});