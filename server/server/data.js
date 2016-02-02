//---------------------------------------------------------------------------
const use_ssl = true;
const port = 3000;
const types = ["movement2", "sound", "humidity", "distance", "temperature", "cputemp", "mem", "load", "lightintensity", "light", "soundvol", "movement1"];

var logger = require("./logger");
var fs = require('fs');
var express = require('express')
var basicAuth = require('basic-auth-connect');
var bodyParser = require('body-parser')
var app = express();
var http = use_ssl ? require('https') : require('http');
var sio = require('socket.io');
var moment = require('moment');
var spawn = require('child_process').spawn;
var storage = require('./storage');
var config = require('./config');
var maintenance = require('./maintenance');

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
    if (!socket)
    {
        return false;
    }

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

    if (msg.type === "mem")
    {
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted mem ${data}`);
        });
    }

    if (msg.type === "load")
    {
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted load ${data}`);
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

    if (msg.type === "lightintensity")
    {
        data = msg.data;

        storage.persistDataPoint(msg.type, data, msg.client_id, function(err, msg)
        {
            if (err)
                return cb(err);

            return cb(null, `extracted light intensity ${data}`);
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
        if (getSocketType(s) === "ui" && getClientId(s) === getClientName(clientSocket))
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
        if (getSocketType(s) === "client" && forClient === getClientName(s))
        {
            logger.info(`found listening client socket: ${s.id}!`);
            responseClientSocket = s;
            return;
        }
    });

    return responseClientSocket;
}

function getClientSocketByClientName(clientName)
{
    if (!clientName)
    {
        return false;
    }

    var responseClientSocket = null;

    io.sockets.sockets.forEach(function(s)
    {
        if (getSocketType(s) === "client" && getClientName(s) === clientName)
        {
            logger.info(`found listening client socket for name ${clientName}: ${s.id}!`);
            responseClientSocket = s;
            return;
        }
    });

    return responseClientSocket;
}

//-----------------------------------------------------------------

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {

    if (req.url.indexOf("worker.js") !== -1)
    {
        res.set('Service-Worker-Allowed', '/');
    }

    if (req.url.indexOf("manifest.json") !== -1)
    {
        res.set('Content-Type', 'application/manifest+json');
    }

    //TODO
    return next();

    false && basicAuth(function(user, pass) {
        return true || req.method === "POST" || (user === config.httpUser && pass === config.httpPass);
    })(req, res, next);
});

app.use(express.static('dist', {
    index: "templates/index.html"
}));

app.post('/pushtoken', function(req, res)
{
    var token = req.body.token;
    var clientName = req.body.client;

    storage.savePushToken(clientName, token, false, function(err, resp)
    {
        if (err)
        {
            logger.error("could not store push token", err);
        }
        else
        {
            logger.info("saved push tokens: " + resp);
        }

        return res.end();
    });
});

app.post('/push', function(req, res)
{
    var clientName = req.body.client;
    var response = { message: "" };

    storage.dailySummary(clientName, function(err, data)
    {
        if (err)
        {
            response.message = "Received error aggregating push information";
            return res.end(JSON.stringify(response));
        }

        var text = [];

        data.forEach(function(d)
        {
            var type = d["_id"];
            var value = parseFloat(d["avg"]).toFixed(2);

            text.push(type + ": " + value);
        });

        response.message = "Last 24h overview for " + clientName + ":\n" + text.join(", ");
        return res.end(JSON.stringify(response));
    });
});

app.post('/remotecommands/:command/:param', function(req, res)
{
    var command = req.params.command;
    var clientSocket = getClientSocketByClientName(req.body.client);
    var param = req.params.param;

    if (!command || !clientSocket)
    {
        logger.error("invalid remotecommand for " + command, req.body);
        return res.end("invalid");
    }

    if (command === "rcswitch")
    {
        logger.info(`Valid request "${command}" for client "${req.body.client}" - ID = ${clientSocket.id}`, "param:", param);

        var request = {
            type: "switchrc",
            data: {
                switchNumber: 1,
                onoff: (parseInt(param, 10) ? 1 : 0)
            }
        };

        clientSocket.emit("actionrequest", request);

        return res.end("command succeeded");
    }

    if (command === "restartshutdown")
    {
        logger.info(`Valid request "${command}" for client "${req.body.client}" - ID = ${clientSocket.id}`, "param:", param);

        var request = {
            mode: param === "shutdown" ? "shutdown" : "restart"
        };

        clientSocket.emit("maintenance", request);

        return res.end("command succeeded");
    }

    return res.end("invalid command type");
});

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
				client_name: getClientName(s),
                connected_at: s.handshake.query.connected_at
			});
		}
	});
	
	res.end(JSON.stringify(clients));
});

//-----------------------------------------------------------------

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

            if (!clientId)
            {
                logger.error("invalid client id for ui socket.");
                socket.disconnect();
                return;
            }

			logger.info(`... is UI connection for ${clientId}`);
			break;
		case "client":
			socketType = "client";

            var clientName = getClientName(socket);

            if (!clientName)
            {
                logger.error("invalid client id for client socket.");
                socket.disconnect();
                return;
            }

            var newConnection = `... is client connection ${clientName}`;
			logger.info(newConnection);
            storage.logEntry("info", newConnection);
			break;
		default:
			logger.error("... is invalid connection", socket.handshake);
			socket.disconnect();
	}

	if (!socketType)
	{
        socket.disconnect();
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

	socketType === "client" && socket.on('client:live-stream', function(data, resp)
    {
		logger.info("got image from client @ " + data.date);
        //pipe stream to waiting ui

        var uiSocket = getUiSocketByClientSocket(socket);

        if (!uiSocket)
        {
            resp({
                received: false
            });

            return logger.info(`no waiting ui client for stream`);
        }

        logger.info("confirming stream to client");

        resp({
            received: true
        });

        uiSocket.emit('cam-stream', {
            date: data.date,
            image: data.image
        });
	});

    socketType === "ui" && socket.on('ui:get-socket-info', function(msg, resp)
    {
        logger.info("getting client socket info");

        var client_socket = getClientSocketByUiSocket(socket);

        if (!client_socket)
        {
            logger.error("could not execute request, no client waiting.");
            return resp("error");
        }

        resp(null, {
            client_name: client_socket.handshake.query.client_name,
            connected_at: client_socket.handshake.query.connected_at
        });
    });

    socketType === "ui" && socket.on('ui:maintenance-info', function(msg, resp)
    {
        //logger.info("getting system maintenance info");

        return maintenance.info(function(err, infotext, syslogEntries)
        {
            if (err)
                logger.error("maintenance", err);
            else
            {
                //logger.info("maintenance", infotext, syslogEntries);
            }

            return resp(err, infotext, syslogEntries);
        });
    });

    socketType === "ui" && socket.on('ui:data-count', function(msg, resp)
    {
        logger.info("getting data count");

        var client_id = getClientName(getClientSocketByUiSocket(socket));

        if (!client_id)
        {
            logger.error("could not execute request, no client waiting.");
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
            logger.error("could not execute request, no client waiting.");
            return;
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
            logger.error("could not execute request, no client waiting.");
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
            logger.error("could not execute request, no client waiting.");
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
            logger.error("could not execute request, no client waiting.");
            return;
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
            logger.error("could not execute request, no client waiting.");
            return;
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