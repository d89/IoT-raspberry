exports.blink = function()
{
    console.log("blinking LED");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/led-green',  []);
    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        console.log("received err: ", data);
    });

    prc.stdout.on('data', function (data)
    {
        console.log("received data: ", data);
    });
};