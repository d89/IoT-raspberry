var logger = require('./logger');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');

var display = require('./sensors/display');
var dht11 = require('./sensors/dht11');
var pir1 = require('./sensors/pir');
var pir2 = require('./sensors/pir');
var lm393 = require('./sensors/lm393');
var sound = require('./sensors/sound');
var light = require('./sensors/light');
var cputemp = require('./sensors/cputemp');
var ledGreen = require('./sensors/led-green');
var ledRed = require('./sensors/led-red');
var switchRc = require('./sensors/switchrc');
var switchBtn = require('./sensors/switch');
var hcsr04 = require('./sensors/hcsr04');
var pcf8591 = require('./sensors/pcf8591');

ledGreen.blink();
ledRed.blink();

var sensormanagement = 
{
    actionsEnabled: false, //toggle sound actions by clap

    sensorUpdateCallback: null,

    init: function(cb)
    {
        var isFirstConnection = (sensormanagement.sensorUpdateCallback === null);

        sensormanagement.sensorUpdateCallback = cb;

        if (isFirstConnection)
        {
            logger.warn("First connect, registering the sensors");
            sensormanagement.registerDHT11();
            sensormanagement.registerCpuTemp();
            sensormanagement.registerLight();
            sensormanagement.registerLM393();
            sensormanagement.registerPir1();
            sensormanagement.registerPir2();
            sensormanagement.registerSound();
            sensormanagement.registerSwitch();
            sensormanagement.registerHcsr04();
            sensormanagement.registerPcf8591();
        }
        else
        {
            logger.warn("reconnect, not registering the sensors");
        }
    },

    //##########################################################################

    sendSensorData: function(data)
    {
        sensormanagement.sensorUpdateCallback(data);
    },

    //##########################################################################

    displayUpdate: function(cpuTemp)
    {
        exec("ps aux | grep python | wc -l", function(err, out1, stderr)
        {
            exec("ps aux | grep node | wc -l", function(err, out2, stderr)
            {
                display.display([
                    "python proc: " + parseInt(out1, 10),
                    "node proc: " + parseInt(out2, 10),
                    "cpu temp " + cpuTemp + "C",
                    "load: " + fs.readFileSync("/proc/loadavg").toString().split(" ").splice(0, 3).join(" ")
                ]);
            });
        });
    },

    //##########################################################################

    registerPcf8591: function()
    {
        pcf8591.watch(function ondata(data)
        {
            var acdc = {};
            acdc.type = 'lightintensity';
            acdc.data = data.light;
            //acdc.poti = data.poti;
            sensormanagement.sendSensorData(acdc);

            //logger.info("sent", acdc);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    },

    //##########################################################################

    registerHcsr04: function()
    {
        hcsr04.watch(function ondata(data)
        {
            var distance = {};
            distance.type = 'distance';
            distance.data = data.distance;
            sensormanagement.sendSensorData(distance);

            //logger.info("sent", hasChanged);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    },

    //##########################################################################

    registerSwitch: function()
    {
        switchBtn.watch(function ondata(data)
        {
            var hasChanged = {};
            hasChanged.type = 'switch';
            hasChanged.data = data.stateChange;
            sensormanagement.sendSensorData(hasChanged);

            //logger.info("sent", hasChanged);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    },

    //##########################################################################

    registerDHT11: function()
    {
        dht11.watch(function ondata(data)
        {
            var temp = {};
            temp.type = 'temperature';
            temp.data = data.temperature;
            sensormanagement.sendSensorData(temp);
            //logger.info("sent", temp);

            var humidity = {};
            humidity.type = 'humidity';
            humidity.data = data.humidity;
            sensormanagement.sendSensorData(humidity);
            //logger.info("sent", humidity);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    },

    //##########################################################################

    registerCpuTemp: function()
    {
        cputemp.watch(function ondata(data)
        {
            var cpu = {};
            cpu.type = 'cputemp';
            cpu.data = data;
            sensormanagement.sendSensorData(cpu);
            //logger.info("sent", cpu);

            sensormanagement.displayUpdate(data);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    },

    //##########################################################################

    registerSound: function()
    {
        sound.watch(function ondata(data)
        {
            var sound = {};
            sound.type = 'soundvol';
            sound.data = data.state;

            sensormanagement.sendSensorData(sound);
            //logger.info("sent", sound);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    },

    //##########################################################################

    registerPir1: function()
    {
        pir1.watch(function ondata(data)
        {
            var movement = {
                type: "movement1",
                data: data.state
            };

            //movement detected
            //TODO
            if (false && data.state === 1 && sensormanagement.actionsEnabled)
            {
                spawn('/usr/bin/mpg321', ["/home/pi/Music/siren.mp3"]);
                switchRc.switch(1, 1, 1);

                setTimeout(function()
                {
                    switchRc.switch(1, 1, 0);
                }, 5000);
            }

            sensormanagement.sendSensorData(movement);
            //logger.info("sent", movement);
        },
        function onclose(msg)
        {
            logger.info(msg);
        },
        {
            port: 38
        });
    },
    
    //##########################################################################

    registerPir2: function()
    {
        pir2.watch(function ondata(data)
        {
            var movement = {
                type: "movement2",
                data: data.state
            };

            sensormanagement.sendSensorData(movement);
            //logger.info("sent", movement);
        },
        function onclose(msg)
        {
            logger.info(msg);
        },
        {
            port: 33
        });
    },

    //##########################################################################
    
    registerLight: function()
    {
        var lastLightState = false;

        light.watch(function ondata(data)
        {
            var light = {
                type: "light",
                data: data.state
            };

            if (sensormanagement.actionsEnabled && !lastLightState && data.state)
            {
                spawn('/usr/bin/mpg321', ["/home/pi/Music/light.mp3"]);
            }

            lastLightState = data.state;
            sensormanagement.sendSensorData(light);

            //logger.info("sent", light);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    },
    
    //##########################################################################

    registerLM393: function()
    {
        lm393.watch(function ondata(data)
        {
            var sound = {
                type: "sound",
                data: data.state === true ? 1 : 0
            };

            if (data.state)
            {
                if (sensormanagement.actionsEnabled)
                {
                    spawn('/usr/bin/mpg321', ["/home/pi/Music/deactivated.mp3"]);
                }
                else
                {
                    spawn('/usr/bin/mpg321', ["/home/pi/Music/activated.mp3"]);
                }

                sensormanagement.actionsEnabled = !sensormanagement.actionsEnabled;
            }

            sensormanagement.sendSensorData(sound);
            //logger.info("sent", sound);
        },
        function onclose(msg)
        {
            logger.info(data);
        });
    }
};

module.exports = sensormanagement;