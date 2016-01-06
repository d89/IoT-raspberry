//---------------------------------------------------------------------------

const server_url = 'https://d1303.de:3000';
const client_name = "Davids IoT-Raspberry";
var socket = require('socket.io-client').connect(server_url, {query: 'mode=client&client_name=' + client_name});

function getRandomInt(min, max) 
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

socket.on('connect', function()
{
	console.log(`connected to ${server_url}`);
	
	setInterval(function()
	{
		if (!socket.connected) 
		{
			return;
		}
		
		var payload = {};
		
		if (getRandomInt(0, 10) > 5)
		{
			payload.type = 'temperature';
			payload.data = getRandomInt(-5, 40);
		}
		else
		{
			payload.type = 'humidity';
			payload.data = getRandomInt(0, 100);
		}

		console.log(`sent to ${server_url}`, payload);
		socket.emit('client:data', payload);
	}, 8500);
});

socket.on('event', function(data)
{
	console.log("received event", data);
});

socket.on('disconnect', function()
{
	console.log(`disconnected from ${server_url}`)
});