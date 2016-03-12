module.exports = {
    serverUrl: 'https://d1303.de:3000',
    clientName: "Davids IoT-Raspberry",
    logFile: "/tmp/logfile.log",
    isoOffset: 1, //in hours, only for the correction of logger timestamps
    baseBath: "/var/www/IoT-raspberry", //no trailing slash
    mediaBasePath: "/home/pi/Music",  //no trailing slash
    restartSensorAfter: 10, //s - if no message for X seconds is received, restart the sensor
    smartphoneIp: "192.168.0.53",
    ledStripLedCount: 104,
    fhem: {
        basic_auth_username: "admin",
        basic_auth_password: "admin",
        port: 8083
    },
    volume: 70, //in percent from 0 to 100
    soundCardInput: 1, //alsamixer -> F6 -> number of interface
    soundCardOutput: 0, //alsamixer -> F6 -> number of interface
    ttsApiKey: "*** snip ***", //voicerss.org
    password: "*** snip ***"
};