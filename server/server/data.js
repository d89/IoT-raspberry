//---------------------------------------------------------------------------
const use_ssl = true;
const port = 3000;
const types = ["movement2", "sound", "humidity", "distance", "temperature", "cputemp", "light", "soundvol", "movement1"];

var logger = require("./logger");
var fs = require('fs');
var express = require('express')
var basicAuth = require('basic-auth-connect');
var app = express();
var http = use_ssl ? require('https') : require('http');
var sio = require('socket.io');
var moment = require('moment');
var spawn = require('child_process').spawn;
var storage = require('./storage');
var config = require('./config');

//---------------------------------------------------------------------------

var ssl_object = {};

if (use_ssl)
{
	var privateKey = fs.readFileSync(config.sslPrivateKeyPath);
	var certificate = fs.readFileSync(config.sslCertificate);
	var ca = fs.readFileSync(config.sslCa);
	ssl_object = {
		key: privateKey,
		cert: certificate,
		ca: [ ca ] //only one cert block in chain, so that's fine. Splitting would be necessary otherwise
	};	
	
	var server = http.createServer(ssl_object, app).listen(port, function()
	{
		logger.info(`listening on *:${port}`);
	});
}
else
{
	var server = http.createServer(app).listen(port, function()
	{
		logger.info(`listening on *:${port}`);
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

//ui socket
function getClientId(socket)
{
	if (socket.handshake.query.mode === "ui" && socket.handshake.query.client)
	{
		return socket.handshake.query.client;
	}

	return false;
}

//client socket
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
	//logger.info("got from client", msg);
	
	if (!("type" in msg) || !("data" in msg) || !("client_id" in msg))
	{
		return cb("malformatted message", msg);
	}
		
	var data = false;
	
	if (msg.type === "temperature")
	{
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted temp ${data}`);
        });
	}
	
	if (msg.type === "humidity")
	{
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted humidity ${data}`);
        });
	}

    if (msg.type === "cputemp")
    {
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted cputemp ${data}`);
        });
    }

	if (msg.type === "movement1")
	{
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted movement1 state ${data}`);
        });
	}

	if (msg.type === "movement2")
	{
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted movement2 state ${data}`);
        });
	}

    if (msg.type === "distance")
    {
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted distance ${data}`);
        });
    }

	if (msg.type === "light")
	{
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted light state ${data}`);
        });
	}

	if (msg.type === "sound")
	{
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted sound state ${data}`);
        });
	}

    if (msg.type === "soundvol")
    {
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted sound vol ${data}`);
        });
    }
}

function getUiSocketByClientSocket(clientSocket)
{
    var responseUiSocket = null;

    io.sockets.sockets.forEach(function(s)
    {
        if (getSocketType(s) === "ui" && getClientId(s) === clientSocket.id)
        {
            responseUiSocket = s;
            return;
        }
    });

    return responseUiSocket;
}

function getClientSocketByUiSocket(uiSocket)
{
    var forClient = getClientId(uiSocket);
    var responseClientSocket = null;

    io.sockets.sockets.forEach(function(s)
    {
        if (getSocketType(s) === "client" && forClient === s.id)
        {
            logger.info(`found listening client socket: ${s.id}!`);
            responseClientSocket = s;
            return;
        }
    });

    return responseClientSocket;
}

app.use(basicAuth(config.httpUser, config.httpPass));

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

function progressFunc(socket)
{
    return function(progress) {
        logger.info("setting progress " + progress);
        socket.emit('progress', { progress: progress });
    }
}

io.on('connection', function(socket)
{
	logger.info(`new connection ${socket.id} from ${socket.client.conn.remoteAddress}`);

	var socketType = null;

	switch (getSocketType(socket))
	{
		case "ui":
			socketType = "ui";
			var clientId = getClientId(socket);
			logger.info(`... is UI connection for ${clientId}`);
			break;
		case "client":
			socketType = "client";
			logger.info(`... is client connection`);
			break;
		default:
			logger.info("... is invalid connection", socket.handshake);
			socket.disconnect();
	}

	if (!socketType)
	{
		return;
	}

	socketType === "client" && socket.on('client:data', function(msg)
	{
        msg.client_id = getClientName(socket);

		persistClientData(msg, function(err, resp)
		{
            if (err)
            {
                logger.error("could not store data point: ", err);
                return;
            }

			//logger.info("PERSISTING: ", err, resp);

            var uiSocket = getUiSocketByClientSocket(socket);

            if (!uiSocket)
            {
                //logger.info(`no waiting ui client for client data`);
                return;
            }

            msg.created = (new Date).getTime();

            //logger.info("data update for ui", msg);

            uiSocket.emit("dataupdate", msg);
		});
	});

	socketType === "client" && socket.on('client:live-stream', function(data)
    {
		logger.info("got image from client @ " + data.date);
        //pipe stream to waiting ui

        var uiSocket = getUiSocketByClientSocket(socket);

        if (!uiSocket)
        {
            return logger.info(`no waiting ui client for stream`);
        }

        uiSocket.emit('cam-stream', {
            date: data.date,
            image: data.image
        });
	});

    socketType === "ui" && socket.on('ui:data-count', function(msg, resp)
    {
        logger.info("getting data count");

        var client_id = getClientName(getClientSocketByUiSocket(socket));

        if (!client_id)
        {
            logger.error("could not execute request, client id missing");
            return resp("error");
        }

        storage.getLastCount(client_id, function(err, count)
        {
            logger.info("responding to data count " + count);
            resp(err, count);
        })
    });

    socketType === "ui" && socket.on('ui:start-stop-stream', function(msg)
    {
        logger.info("ui request to start/stop streaming", msg);

        var clientSocket = getClientSocketByUiSocket(socket);

        if (!clientSocket)
        {
            return logger.info(`no waiting client for ui request`);
        }

        //start or stop stream?
        var data = {
            start: msg.start
        };

        clientSocket.emit('start-start-stream', data);
    });

	socketType === "ui" && socket.on('ui:full', function(msg, resp)
	{
		logger.info("full request from ui: ", msg);

		var type = msg.type;
        var client_id = getClientName(getClientSocketByUiSocket(socket));

        if (!client_id)
        {
            logger.error("could not execute request, client id missing");
            return resp([]);
        }

        storage.getDataPoints(type, client_id, function(err, data)
		{
            if (err)
            {
                logger.error("could not get data points", err);
                return resp([]);
            }

			//logger.info("data", data);

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

    socketType === "ui" && socket.on('ui:aggregation', function(query, resp)
    {
        //-----------------------------------------------------------------

        var start = moment(query.start);
        var end = moment(query.end);
        var interval = query.interval;
        var skipcache = query.skipcache;

        //-----------------------------------------------------------------

        logger.info("aggregation request from ui from " + start + " to " + end + " in interval", interval);
        var client_id = getClientName(getClientSocketByUiSocket(socket));

        if (!client_id)
        {
            logger.error("could not execute request, client id missing");
            return resp([]);
        }

        storage.aggregation(start, end, interval, types, client_id, skipcache, progressFunc(socket), function(err, dps)
        {
            //logger.info("responding to last hour request", dps);
            resp(dps);
        });
    });

    socketType === "ui" && socket.on('ui:action', function(msg)
    {
        var clientSocket = getClientSocketByUiSocket(socket);

        if (!clientSocket)
        {
            return logger.info(`no waiting client for ui request`);
        }

        var request = {
            type: msg.type,
            data: msg.data
        };

        clientSocket.emit("actionrequest", request);
    });

    socketType === "ui" && socket.on('ui:maintenance', function(msg)
    {
        var clientSocket = getClientSocketByUiSocket(socket);

        if (!clientSocket)
        {
            return logger.info(`no waiting client for ui request`);
        }

        var request = {
            mode: msg.mode === "shutdown" ? "shutdown" : "restart"
        };

        clientSocket.emit("maintenance", request);
    });

	socket.on('disconnect', function(msg)
	{
        var uiSocket = getUiSocketByClientSocket(socket);

        if (!uiSocket)
        {
            //logger.info(`no waiting ui client for client data`);
            return;
        }

        uiSocket.emit("client-disconnected", {
            id: socket.id
        });

		logger.info(`socket ${socket.id} disconnected: ${msg}`);
	});
});

//---------------------------------------------------------------------------