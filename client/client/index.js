//---------------------------------------------------------------------------

var actionsEnabled = false; //toggle sound actions by clap

const server_url = 'https://d1303.de:3000';
const client_name = "Davids IoT-Raspberry";
var socket = require('socket.io-client').connect(server_url, {query: 'mode=client&client_name=' + client_name});
var spawn = require('child_process').spawn;

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
var display = require('./sensors/display');

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
        var cpu = {};
        cpu.type = 'cputemp';
        cpu.data = data;
        socket.emit('client:data', cpu);
        console.log(`sent to ${server_url}`, cpu);
    },
    function onclose(msg)
    {
        console.log(data);
    });

    //##########################################################################

    sound.watch(function ondata(data)
    {
        var sound = {};
        sound.type = 'soundvol';
        sound.data = data.state;

        display.display("sound volume: " + sound.data);

        socket.emit('client:data', sound);
        console.log(`sent to ${server_url}`, sound);
    },
    function onclose(msg)
    {
        console.log(data);
    });

    //##########################################################################

    pir1.watch(function ondata(data)
    {
        var movement = {
            type: "movement1",
            data: data.state
        };

        //movement detected
        if (data.state === 1 && actionsEnabled)
        {
            spawn('/usr/bin/mpg321', ["/home/pi/Music/siren.mp3"]);
            switchRc.switch(1, 1, 1);

            setTimeout(function()
            {
                switchRc.switch(1, 1, 0);
            }, 5000);
        }

        socket.emit('client:data', movement);
        console.log(`sent to ${server_url}`, movement);
    },
    function onclose(msg)
    {
        console.log(msg);
    },
    {
        port: 38
    });

    pir2.watch(function ondata(data)
    {
        var movement = {
            type: "movement2",
            data: data.state
        };

        socket.emit('client:data', movement);
        console.log(`sent to ${server_url}`, movement);
    },
    function onclose(msg)
    {
        console.log(msg);
    },
    {
        port: 33
    });

    //##########################################################################

    var lastLightState = false;

    light.watch(function ondata(data)
    {
        var light = {
            type: "light",
            data: data.state
        };

        if (actionsEnabled && !lastLightState && data.state)
        {
            spawn('/usr/bin/mpg321', ["/home/pi/Music/light.mp3"]);
        }

        lastLightState = data.state;

        socket.emit('client:data', light);
        console.log(`sent to ${server_url}`, light);
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

        if (data.state)
        {
            if (actionsEnabled)
            {
                spawn('/usr/bin/mpg321', ["/home/pi/Music/deactivated.mp3"]);
            }
            else
            {
                spawn('/usr/bin/mpg321', ["/home/pi/Music/activated.mp3"]);
            }

            actionsEnabled = !actionsEnabled;
        }

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