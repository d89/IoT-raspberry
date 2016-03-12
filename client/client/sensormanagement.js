var config = require('./config');
var logger = require('./logger');

exports.registeredSensors = {};

exports.init = function(options)
{
    //do not reregister
    if (Object.keys(exports.registeredSensors).length !== 0)
    {
        logger.info("Sensors already registered, skipping.");
        return exports.registeredSensors;
    }

    var onData = options.onData;

    // ----------------------------------------------------

    var humidity = require('./sensors/humidity');
    exports.registeredSensors["humidity"] = new humidity({
        onData: onData,
        pin: 25, //gpio numbering
        interval: 2
    });

    // ----------------------------------------------------

    var temperature = require('./sensors/temperature');
    exports.registeredSensors["temperature"] = new temperature({
        onData: onData,
        pin: 25, //gpio numbering
        interval: 2
    });

    // ----------------------------------------------------

    var cputemp = require('./sensors/cputemp');
    exports.registeredSensors["cputemp"] = new cputemp({
        onData: onData,
        interval: 5
    });

    // ----------------------------------------------------

    var lightintensity = require('./sensors/lightintensity');
    exports.registeredSensors["lightintensity"] = new lightintensity({
        onData: onData,
        pin: 0x48, //i2c hex address (i2cdetect -y 1)
        interval: 6
    });

    // ----------------------------------------------------

    var poti = require('./sensors/poti');
    exports.registeredSensors["poti"] = new poti({
        onData: onData,
        pin: 0x48, //i2c hex address (i2cdetect -y 1)
        interval: 6
    });

    // ----------------------------------------------------

    var time = require('./sensors/time');
    var sentTimeDatapoints = 0;
    exports.registeredSensors["time"] = new time({
        onData: function(type, data)
        {
            if (sentTimeDatapoints % 5 === 0)
                onData(type, data);

            sentTimeDatapoints++;
        },
        interval: 1
    });

    // ----------------------------------------------------

    var date = require('./sensors/date');
    exports.registeredSensors["date"] = new date({
        onData: onData,
        interval: 60
    });

    // ----------------------------------------------------

    var movement = require('./sensors/movement');
    exports.registeredSensors["movement1"] = new movement({
        pin: 33,
        interval: 5,
        suffix: "1",
        onData: onData
    });

    // ----------------------------------------------------

    exports.registeredSensors["movement2"] = new movement({
        pin: 38,
        interval: 5,
        suffix: "2",
        onData: onData
    });

    // ----------------------------------------------------

    var tapswitch = require('./sensors/tapswitch');
    exports.registeredSensors["tapswitch"] = new tapswitch({
        onData: onData,
        restartSensorAfter: false,
        pin: 35
    });

    // ----------------------------------------------------

    var sound = require('./sensors/sound');
    exports.registeredSensors["sound"] = new sound({
        onData: onData,
        pin: 15,
        interval: 4
    });

    // ----------------------------------------------------

    var soundvol = require('./sensors/soundvol');
    exports.registeredSensors["soundvol"] = new soundvol({
        onData: onData,
        pin: 37,
        interval: 4
    });

    // ----------------------------------------------------

    var load = require('./sensors/load');
    exports.registeredSensors["load"] = new load({
        onData: onData,
        interval: 4
    });

    // ----------------------------------------------------

    var light = require('./sensors/light');
    exports.registeredSensors["light"] = new light({
        onData: onData,
        pin: 36,
        interval: 4
    });

    // ----------------------------------------------------

    var mem = require('./sensors/mem');
    exports.registeredSensors["mem"] = new mem({
        onData: onData,
        interval: 4
    });

    // ----------------------------------------------------

    var diskfree = require('./sensors/diskfree');
    exports.registeredSensors["diskfree"] = new diskfree({
        onData: onData,
        interval: 4
    });

    // ----------------------------------------------------

    var distance = require('./sensors/distance');
    exports.registeredSensors["distance"] = new distance({
        onData: onData,
        pin_trigger: 31,
        pin_echo: 29,
        interval: 3
    });

    // ----------------------------------------------------

    var reachability = require('./sensors/reachability');
    exports.registeredSensors["reachability"] = new reachability({
        onData: onData,
        ip: config.smartphoneIp,
        interval: 5
    });

    // ----------------------------------------------------

    var desired_temperature_homematic = require('./sensors/desired_temperature_homematic');
    exports.registeredSensors["desired_temperature_homematic"] = new desired_temperature_homematic({
        onData: onData,
        interval: 5,
        thermostatName: "HM_37F678"
    });

    // ----------------------------------------------------

    var measured_temperature_homematic = require('./sensors/measured_temperature_homematic');
    exports.registeredSensors["measured_temperature_homematic"] = new measured_temperature_homematic({
        onData: onData,
        interval: 5,
        thermostatName: "HM_37F678"
    });

    // ----------------------------------------------------

    var desired_temperature_zwave = require('./sensors/desired_temperature_zwave');
    exports.registeredSensors["desired_temperature_zwave"] = new desired_temperature_zwave({
        onData: onData,
        interval: 5,
        thermostatName: "ZWave_THERMOSTAT_11"
    });

    // ----------------------------------------------------

    var measured_temperature_zwave = require('./sensors/measured_temperature_zwave');
    exports.registeredSensors["measured_temperature_zwave"] = new measured_temperature_zwave({
        onData: onData,
        interval: 5,
        thermostatName: "ZWave_THERMOSTAT_11"
    });

    // ----------------------------------------------------

    var battery_thermostat_zwave = require('./sensors/battery_thermostat_zwave');
    exports.registeredSensors["battery_thermostat_zwave"] = new battery_thermostat_zwave({
        onData: onData,
        interval: 5,
        thermostatName: "ZWave_THERMOSTAT_11"
    });

    // ----------------------------------------------------

    var watt = require('./sensors/watt');
    exports.registeredSensors["watt"] = new watt({
        onData: onData,
        interval: 5,
        switchName: "ZWave_SWITCH_BINARY_17"
    });

    // ----------------------------------------------------

    var meter = require('./sensors/meter');
    exports.registeredSensors["meter"] = new meter({
        onData: onData,
        interval: 5,
        switchName: "ZWave_SWITCH_BINARY_17"
    });

    // ----------------------------------------------------

    var lux = require('./sensors/lux');
    exports.registeredSensors["lux"] = new lux({
        onData: onData,
        interval: 5,
        motionSensorName: "ZWave_SENSOR_BINARY_18"
    });

    // ----------------------------------------------------

    var battery_motionsensor_zwave = require('./sensors/battery_motionsensor_zwave');
    exports.registeredSensors["battery_motionsensor_zwave"] = new battery_motionsensor_zwave({
        onData: onData,
        motionSensorName: "ZWave_SENSOR_BINARY_18",
        interval: 5
    });

    // ----------------------------------------------------

    var movement_zwave = require('./sensors/movement_zwave');
    exports.registeredSensors["movement_zwave"] = new movement_zwave({
        onData: onData,
        interval: 5,
        motionSensorName: "ZWave_SENSOR_BINARY_18"
    });

    // ----------------------------------------------------

    var movement_temperature = require('./sensors/movement_temperature');
    exports.registeredSensors["movement_temperature"] = new movement_temperature({
        onData: onData,
        interval: 5,
        motionSensorName: "ZWave_SENSOR_BINARY_18"
    });

    // ----------------------------------------------------

    var barometric_temp = require('./sensors/barometric_temp');
    exports.registeredSensors["barometric_temp"] = new barometric_temp({
        onData: onData,
        pin: 0x77, //i2c hex address (i2cdetect -y 1)
        interval: 4
    });

    // ----------------------------------------------------

    var altitude = require('./sensors/altitude');
    exports.registeredSensors["altitude"] = new altitude({
        onData: onData,
        pin: 0x77, //i2c hex address (i2cdetect -y 1)
        interval: 4
    });

    // ----------------------------------------------------

    var pressure = require('./sensors/pressure');
    exports.registeredSensors["pressure"] = new pressure({
        onData: onData,
        pin: 0x77, //i2c hex address (i2cdetect -y 1)
        interval: 4
    });

    // ----------------------------------------------------

    var outside_temp = require('./sensors/outside_temp');
    exports.registeredSensors["outside_temp"] = new outside_temp({
        onData: onData,
        interval: 4
    });

    // ----------------------------------------------------

    return exports.registeredSensors;
};