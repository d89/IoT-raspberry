//---------------------------------------------------------------------------

const server_url = 'https://d1303.de:3000';
const client_name = "Davids IoT-Raspberry";
var io = require('socket.io-client');
var socket = io.connect(server_url, {query: 'mode=client&connected_at=' + (new Date) + '&client_name=' + client_name});
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var logger = require('./logger');
var cam = require('./sensors/cam');
var sensormanagement = require('./sensormanagement');

var switchRc = require('./actors/switchrc');
var ledGreen = require('./actors/led-green');
var ledRed = require('./actors/led-red');
var servo = require('./actors/servo');

logger.info(`client ${client_name} connecting to ${server_url}`);

socket.on('connect', function()
{
    if (!socket.connected)
    {
        return;
    }

    logger.info(`connected to ${server_url}`);

    sensormanagement.init(function(data)
    {
        //logger.info("new sensor data: ", data);
        socket.emit("client:data", data);
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
        logger.info("malformatted actionrequest");
        return;
    }

    //RC SWITCH  -----------------------------------------------------------------------
    if (msg.type === "switchrc")
    {
        var switchNumber = msg.data.switchNumber;
        var onoff = msg.data.onoff;

        logger.info(`actionrequest for rc switch ${switchNumber} to status ${onoff}`);

        switchRc.act(1, switchNumber, onoff);
    }

    if (msg.type === "servo")
    {
        var onoff = msg.data.onoff;

        logger.info(`actionrequest for servo to status ${onoff}`);

        servo.act(onoff);
    }

    //LED ------------------------------------------------------------------------------
    if (msg.type === "led")
    {
        logger.info(`actionrequest for LED ${msg.data.ledType}`);

        if (msg.data.ledType === "red")
        {
            ledRed.act();
        }
        else if (msg.data.ledType === "green")
        {
            ledGreen.act();
        }
    }
});

//request from server client (passed by ui)
socket.on('start-start-stream', function(msg)
{
    var start = !!msg.start;

    if (start)
    {
        logger.info("Received stream start request");
        if (!cam.streamRunning) {
            cam.startStreaming(socket);
        } else {
            cam.sendImage();
        }
    }
    else
    {
        logger.info("Received stream stop request");
        cam.stopStreaming();
    }
});

socket.on('maintenance', function(msg)
{
    logger.info("received maintenance request", msg);

    if (msg.mode === "shutdown")
    {
        spawn("/sbin/shutdown", ["now"]);
    }
    else
    {
        spawn("/sbin/reboot", ["now"]);
    }
});

socket.on('disconnect', function()
{
	logger.info(`disconnected from ${server_url}`);
    cam.stopStreaming();
});