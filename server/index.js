//---------------------------------------------------------------------------
const use_ssl = true;
const port = 3000;

var mongoose = require('mongoose');
var fs = require('fs');
var express = require('express')
var app = express();
var http = use_ssl ? require('https') : require('http');
var sio = require('socket.io');
var spawn = require('child_process').spawn;

//---------------------------------------------------------------------------

mongoose.connect('mongodb://localhost/IoT');
var dp = require("./storage.js");

var ssl_object = {};

if (use_ssl)
{
	var privateKey = fs.readFileSync('/etc/letsencrypt/live/d1303.de/privkey.pem');
	var certificate = fs.readFileSync('/etc/letsencrypt/live/d1303.de/cert.pem');
	var ca = fs.readFileSync('/etc/letsencrypt/live/d1303.de/chain.pem');
	ssl_object = {
		key: privateKey,
		cert: certificate,
		ca: [ ca ] //only one cert block in chain, so that's fine. Splitting would be necessary otherwise
	};	
	
	var server = http.createServer(ssl_object, app).listen(port, function()
	{
		console.log(`listening on *:${port}`);
	});
}
else
{
	var server = http.createServer(app).listen(port, function()
	{
		console.log(`listening on *:${port}`);
	});
}
//---------------------------------------------------------------------------

var io = sio.listen(server, ssl_object);

//---------------------------------------------------------------------------

function getSocketType(socket)
{
	if (socket.handshake.query.mode === "ui" && getClientId(socket))
	{
		return "ui";
	}

	if (socket.handshake.query.mode === "client" && getClientName(socket))
	{
		return "client";
	}

	return false;
}

function getClientId(socket)
{
	if (socket.handshake.query.mode === "ui" && socket.handshake.query.client)
	{
		return socket.handshake.query.client;
	}

	return false;
}

function getClientName(socket)
{
	if (socket.handshake.query.mode === "client" && socket.handshake.query.client_name)
	{
		return socket.handshake.query.client_name;
	}

	return false;
}

function persistClientData(msg, cb)
{
	console.log("got from client", msg);
	
	if (!("type" in msg) || !("data" in msg))
	{
		return cb("malformatted message", msg);
	}
		
	var data = false;
	
	if (msg.type === "temperature")
	{
		data = msg.data;
		//TODO check if saving was successful
		//TODO store client id aswell
		dp.persistDataPoint(msg.type, data, function()
		{
			//console.log(`persisted ${msg.type}!`)
		});
		
		return cb(null, `extracted temperature ${data}°C`);
	}
	
	if (msg.type === "humidity")
	{
		data = msg.data;
		//TODO check if saving was successful
		//TODO store client id aswell
		dp.persistDataPoint(msg.type, data, function()
		{
			//console.log(`persisted ${msg.type}!`)
		});
		
		return cb(null, `extracted humidity ${data}%`);
	}

    if (msg.type === "cputemp")
    {
        data = msg.data;
        //TODO check if saving was successful
        //TODO store client id aswell
        dp.persistDataPoint(msg.type, data, function()
        {
            //console.log(`persisted ${msg.type}!`)
        });

        return cb(null, `extracted cputemp ${data}°C`);
    }

	if (msg.type === "movement")
	{
		data = msg.data === "movement" ? 1 : 0;

		//TODO check if saving was successful
		//TODO store client id aswell
		dp.persistDataPoint(msg.type, data, function()
		{
			//console.log(`persisted ${msg.type}!`)
		});

		return cb(null, `extracted movement state ${data}`);
	}

	if (msg.type === "sound")
	{
		data = msg.data === "sound" ? 1 : 0;
		//TODO check if saving was successful
		//TODO store client id aswell
		dp.persistDataPoint(msg.type, data, function()
		{
			//console.log(`persisted ${msg.type}!`)
		});

		return cb(null, `extracted sound state ${data}`);
	}
	
	return cb(`Invalid data type ${msg.type}`);
}

function respondFromClientToUi(msg, clientSocket, cb)
{
	console.log(`searching for UI client from clientSocket ${clientSocket.id} to answer to message`, msg);

	var foundValidClient = false;

	io.sockets.sockets.forEach(function(s)
	{
		if (getSocketType(s) === "ui" && getClientId(s) === clientSocket.id)
		{
			console.log(`found listening ui socket: ${s.id}!`);
			foundValidClient = true;

			msg.created = (new Date).getTime();
			s.emit("dataupdate", msg);
		}
	});

	if (!foundValidClient)
	{
		console.log(`no waiting UI client for ${clientSocket.id} was found`);
	}
}

app.use(express.static('frontend'));

app.get('/clients/get', function(req, res)
{
	var clients = [];

	io.sockets.sockets.forEach(function(s)
	{
		if (getSocketType(s) === "client")
		{
			clients.push
			({
				id: s.id,
				address: s.client.conn.remoteAddress,
				client_name: getClientName(s)
			});
		}
	});
	
	res.end(JSON.stringify(clients));
});

io.on('connection', function(socket)
{
	console.log(`new connection ${socket.id} from ${socket.client.conn.remoteAddress}`);

	var socketType = null;

	switch (getSocketType(socket))
	{
		case "ui":
			socketType = "ui";
			var clientId = getClientId(socket);
			console.log(`... is UI connection for ${clientId}`);
			break;
		case "client":
			socketType = "client";
			console.log(`... is client connection`);
			break;
		default:
			console.log("... is invalid connection", socket.handshake);
			socket.disconnect();
	}

	if (!socketType)
	{
		return;
	}

	socketType === "client" && socket.on('client:data', function(msg)
	{
		//if (true) return;

		persistClientData(msg, function(err, resp)
		{
            err = !err ? "valid" : err;

			console.log("PERSISTING: ", err, resp);

			respondFromClientToUi(msg, socket, function(err, resp)
			{
				console.log("RESPONDING TO CLIENT: ", err, resp);
			});
		});
	});

	socketType === "ui" && socket.on('ui:full', function(msg, resp)
	{
		console.log("full request from ui: ", msg);

		var type = msg.type;
		var lastId = msg.lastId;

		dp.getDataPoints(type, lastId, function(data)
		{
			var datapoints = [];

			for (var i = 0; i < data.length; i++)
			{
				datapoints.push({
					id: data[i]._id,
					data: data[i].data,
					type: data[i].type,
					created: data[i].created
				});
			}

			resp(datapoints);
		});
	});

    socketType === "ui" && socket.on('ui:action', function(msg)
    {
        var forClient = getClientId(socket);
        var foundValidClient = false;
        console.log(`action message from ui for client ${forClient}`, msg);

        //send to raspberry
        io.sockets.sockets.forEach(function(s)
        {
            if (getSocketType(s) === "client" && forClient === s.id)
            {
                console.log(`found listening client socket: ${s.id}!`);
                foundValidClient = true;

                var request = {
                    type: msg.type,
                    data: msg.data
                };

                msg.created = (new Date).getTime();
                s.emit("actionrequest", request);
            }
        });

        if (!foundValidClient)
        {
            console.log(`no waiting raspberry client with id ${forClient} was found`);
        }
    });

	socket.on('disconnect', function(msg)
	{	
		console.log(`socket ${socket.id} disconnected: ${msg}`);
	});
});

//---------------------------------------------------------------------------