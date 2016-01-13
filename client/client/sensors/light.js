exports.watch = function(ondata, onclose)
{
    console.log("watching Light");
    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/light',  []);

    prc.stdout.setEncoding('utf8');

    prc.stderr.on('data', function (data)
    {
        console.log("received err: ", data);
    });

    prc.stdout.on('data', function (data)
    {
        try
        {
            //console.log("received: ", data);
            data = JSON.parse("" + data);

            ondata(data);
        }
        catch (err)
        {
            return;
        }
    });

    prc.on('close', function (code)
    {
        onclose('light sensor reader exited with ' + code);
    });
};

/*
exports.watch(function(succ, err)
{
   console.log(succ, err);
});
*/