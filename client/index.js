//---------------------------------------------------------------------------

const server_url = 'https://d1303.de:3000';
const client_name = "Davids IoT-Raspberry";
var socket = require('socket.io-client').connect(server_url, {query: 'mode=client&client_name=' + client_name});
var spawn = require('child_process').spawn;

var dht11 = require('./sensors/dht11');
var pir = require('./sensors/pir');
var lm393 = require('./sensors/lm393');
var cputemp = require('./sensors/cputemp');
var ledGreen = require('./sensors/led-green');
var ledRed = require('./sensors/led-red');
var switchRc = require('./sensors/switchrc');

socket.on('connect', function()
{
    if (!socket.connected)
    {
        return;
    }

	console.log(`connected to ${server_url}`);

    ledGreen.blink();
    ledRed.blink();

    //##########################################################################

    dht11.watch(function ondata(data)
    {
        var temp = {};
        temp.type = 'temperature';
        temp.data = data.temperature;
        socket.emit('client:data', temp);
        console.log(`sent to ${server_url}`, temp);

        var humidity = {};
        humidity.type = 'humidity';
        humidity.data = data.humidity;
        socket.emit('client:data', humidity);
        console.log(`sent to ${server_url}`, humidity);
    },
    function onclose(msg)
    {
        console.log(data);
    });

    //##########################################################################

    cputemp.watch(function ondata(data)
    {
        var cputemp = {};
        cputemp.type = 'cputemp';
        cputemp.data = data;
        socket.emit('client:data', cputemp);
        console.log(`sent to ${server_url}`, cputemp);
    },
    function onclose(msg)
    {
        console.log(data);
    });

    //##########################################################################

    pir.watch(function ondata(data)
    {
        var movement = {
            type: "movement",
            data: data.state
        };

        //movement detected
        if (data.state === 1)
            spawn('/usr/bin/mpg321', ["/home/pi/Music/siren.mp3"]);

        socket.emit('client:data', movement);
        console.log(`sent to ${server_url}`, movement);
    },
    function onclose(msg)
    {
        console.log(data);
    });

    //##########################################################################

    lm393.watch(function ondata(data)
    {
        var sound = {
            type: "sound",
            data: data.state === true ? 1 : 0
        };

        //sound detected
        if (data.state === true)
            spawn('/usr/bin/mpg321', ["/home/pi/Music/gong.mp3"]);

        socket.emit('client:data', sound);
        console.log(`sent to ${server_url}`, sound);
    },
    function onclose(msg)
    {
        console.log(data);
    });
});

//requests from the server to a client raspberry
socket.on('actionrequest', function(msg)
{
    /*
    known messages:
         { type: 'switchrc', data: { switchNumber: '1', onoff: '0' } }
         { type: 'led', data: { ledType: 'red' } }
     */

    if (!msg.type)
    {
        console.log("malformatted actionrequest");
        return;
    }

    //RC SWITCH  -----------------------------------------------------------------------
    if (msg.type === "switchrc")
    {
        var switchNumber = msg.data.switchNumber;
        var onoff = msg.data.onoff;

        console.log(`actionrequest for rc switch ${switchNumber} to status ${onoff}`);

        switchRc.switch(1, switchNumber, onoff);
    }

    //LED ------------------------------------------------------------------------------
    if (msg.type === "led")
    {
        console.log(`actionrequest for LED ${msg.data.ledType}`);

        if (msg.data.ledType === "red")
        {
            ledRed.blink();
        }
        else if (msg.data.ledType === "green")
        {
            ledGreen.blink();
        }
    }
});

socket.on('disconnect', function()
{
	console.log(`disconnected from ${server_url}`)
});