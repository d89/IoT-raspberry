exports.switch = function(channel, device, state)
{
    console.log(`switching rc plug: channel ${channel}, device ${device}, state ${state}`);
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/switchrc', [channel, device, state]);
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

//exports.switch(1, 1, 0);