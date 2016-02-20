module.exports = {
    serverUrl: 'https://d1303.de:3000',
    clientName: "Davids IoT-Raspberry",
    logFile: "/tmp/logfile.log",
    isoOffset: 1, //in hours, only for the logger timestamps
    baseBath: "/var/www/IoT-raspberry", //no trailing slash
    mediaBasePath: "/home/pi/Music",  //no trailing slash
    chartTypes: ["temperature", "cputemp", "mem", "load", "humidity", "distance", "lightintensity", "light", "soundvol", "sound", "movement1", "movement2", "poti", "reachability"],
    restartSensorAfter: 10, //s - if no message for X seconds is received, restart the sensor
    smartphoneIp: "192.168.0.53",
    ttsApiKey: "*** snip ***", //voicerss.org
    password: "*** snip ***"
};