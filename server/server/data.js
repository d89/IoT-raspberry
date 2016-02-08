//---------------------------------------------------------------------------
//dependencies
var logger = require("./logger");
var fs = require('fs');
var express = require('express')
var bodyParser = require('body-parser')
var app = express();
var io = require('socket.io')();
var moment = require('moment');
var spawn = require('child_process').spawn;
var storage = require('./storage');
var config = require('./config');
var maintenance = require('./maintenance');
var middleware = require('socketio-wildcard')();
var async = require('async');

//config
const use_ssl = config.useSsl;
const port = config.port;
var http = use_ssl ? require('https') : require('http');

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

io.use(middleware);

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

function getClientSocketByUiSocket(uiSocket, dataReceived)
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

    if (!responseClientSocket)
    {
        return {
            error: "disconnect"
        };
    }

    var uiPassword = dataReceived && dataReceived.password;
    var clientPassword = responseClientSocket.handshake.query.password;

    if (uiPassword !== clientPassword)
    {
        logger.error("client socket found, password wrong!");

        return {
            error: "wrongpassword",
            socket: responseClientSocket
        };
    }

    return {
        socket: responseClientSocket
    };
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

function apiAuth(res, password, clientName, justReturn)
{
    var clientSocket = getClientSocketByClientName(clientName);

    if (!clientSocket)
    {
        if (justReturn) return false;
        return res.status(404).send('Client "' + clientName + '" not found.');
    }

    var clientPassword = clientSocket.handshake.query.password;
    if (password !== clientPassword)
    {
        if (justReturn) return false;
        return res.status(401).send('Wrong password for "' + clientName + '".');
    }

    return true;
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

    return next();
});

app.use(express.static('dist', {
    index: "templates/index.html"
}));

app.post('/pushtoken', function(req, res)
{
    var token = req.body.tkn;
    var clientName = req.body.client;

    //auth
    if (true !== apiAuth(res, req.body.password, clientName))
    {
        return logger.error("web auth failed");
    }

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
    var clientData = req.body.client;
    var response = { message: "" };
    var respond = function(res, msg)
    {
        response.message = msg;
        return res.end(JSON.stringify(response));
    };

    //---------------------------------------------

    try {
        clientData = JSON.parse(clientData);

        if (Object.keys(clientData).length === 0)
        {
            return respond(res, "No client registered");
        }
    } catch (err) {
        logger.error("push parsing for ", clientData, err);
        return respond(res, "Invalid request");
    }

    //---------------------------------------------

    logger.info("received push request for", clientData);

    var callbacks = [];

    //password validation and callback construction for every client
    for (var clientName in clientData)
    {
        var clientPassword = clientData[clientName].password;

        if (true === apiAuth(res, clientPassword, clientName, true))
        {
            callbacks.push(function(cb)
            {
                storage.dailySummary(clientName, cb);
            });
        }
        else
        {
            callbacks.push(function(cb)
            {
                return cb(null, "Invalid Password for client " + clientName);
            });
        }
    }

    async.parallel(callbacks, function(err, data)
    {
        //only one error callback is being executed.
        if (err)
        {
            return respond(res, "Received error aggregating push information: " + err);
        }

        //all the succeeding callbacks are packed together in "data"
        data = data.join("---\n");

        return respond(res, data);
    });
});

app.post('/remotecommands/:command/:param', function(req, res)
{
    var command = req.params.command;
    var param = req.params.param;
    var clientName = req.body.client;
    var password = req.body.password;
    var clientSocket = getClientSocketByClientName(req.body.client);

    if (!command || !clientSocket)
    {
        logger.error("invalid remotecommand for " + command, req.body);
        return res.end("invalid");
    }

    //password
    if (true !== apiAuth(res, password, clientName))
    {
        return logger.error("remotecommand: invalid password for " + clientName);
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
        //logger.info("setting progress " + progress);
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
            storage.logEntry("info", newConnection, clientName);
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

    //###########################################################################

    socketType === "ui" && socket.on('*', function(msg)
    {
        var ui =
        {
            'ui:get-socket-info': function (clientSocket, msg, resp) {
                logger.info("getting client socket info");

                var caps = JSON.parse(clientSocket.handshake.query.capabilities) || [];

                resp(null, {
                    capabilities: caps,
                    client_name: clientSocket.handshake.query.client_name,
                    connected_at: clientSocket.handshake.query.connected_at
                });
            },
            //-------------------------------------------------------------------------------------
            'ui:maintenance-info': function (clientSocket, msg, resp) {
                //logger.info("getting system maintenance info");

                var client_id = getClientName(clientSocket);

                return maintenance.info(client_id, function (err, infotext, syslogEntries)
                {
                    var errResponse = function (err) {
                        logger.error(err);
                        return resp(err);
                    };

                    if (err) {
                        return errResponse(err);
                    }

                    var data = {
                        start: msg.start
                    };

                    var request = {
                        mode: "log"
                    };

                    clientSocket.emit("maintenance", request, function (err, logResponse) {
                        if (err) {
                            return errResponse(err);
                        }

                        return resp(err, infotext, syslogEntries, logResponse);
                    });
                });
            },
            //-------------------------------------------------------------------------------------
            'ui:data-count': function (clientSocket, msg, resp) {
                logger.info("getting data count");

                var client_id = getClientName(clientSocket);

                storage.getLastCount(client_id, function (err, count) {
                    logger.info("responding to data count " + count);
                    resp(err, count);
                })
            },
            //-------------------------------------------------------------------------------------
            'ui:start-stop-stream': function (clientSocket, msg) {
                logger.info("ui request to start/stop streaming", msg);

                //start or stop stream?
                var data = {
                    start: msg.start
                };

                clientSocket.emit('start-start-stream', data);
            },
            //-------------------------------------------------------------------------------------
            'ui:full': function (clientSocket, msg, resp) {
                //logger.info("full request from ui: ", msg);

                var type = msg.type;

                var client_id = getClientName(clientSocket);

                storage.getDataPoints(type, client_id, function (err, data) {
                    if (err) {
                        logger.error("could not get data points", err);
                        return resp(err);
                    }

                    //logger.info("data", data);

                    var datapoints = [];

                    for (var i = 0; i < data.length; i++) {
                        datapoints.push({
                            id: data[i]._id,
                            data: data[i].data,
                            type: data[i].type,
                            created: data[i].created
                        });
                    }

                    resp(null, datapoints);
                });
            },
            //-------------------------------------------------------------------------------------
            'ui:aggregation': function (clientSocket, query, resp) {
                var start = moment(query.start);
                var end = moment(query.end);
                var interval = query.interval;
                var skipcache = query.skipcache;

                logger.info("aggregation request from ui from " + start + " to " + end + " in interval", interval);

                var client_id = getClientName(clientSocket);

                var client_capabilities = JSON.parse(clientSocket.handshake.query.capabilities) || [];

                storage.aggregation(start, end, interval, client_capabilities, client_id, skipcache, progressFunc(socket), function (err, dps) {
                    //logger.info("responding to last hour request", dps);
                    resp(null, dps);
                });
            },
            //-------------------------------------------------------------------------------------
            'ui:action': function (clientSocket, msg) {
                var request = {
                    type: msg.type,
                    data: msg.data
                };

                clientSocket.emit("actionrequest", request);
            },
            //-------------------------------------------------------------------------------------
            'ui:maintenance': function (clientSocket, msg) {
                var request = {
                    mode: msg.mode === "shutdown" ? "shutdown" : "restart"
                };

                clientSocket.emit("maintenance", request);
            }
        };

        //-------------------------------------------------------------------------------------

        var eventType = msg.data[0];
        var payload = msg.data[1];
        var respFunc = msg.data[2];

        var resp = getClientSocketByUiSocket(socket, payload);

        if (resp.error)
        {
            console.error("could not find client for ui: " + resp.error);

            if (respFunc)
            {
                respFunc(resp.error);

                if (resp.error === "wrongpassword")
                {
                    console.error("disconnecting from ui socket - wrong password!");
                    socket.disconnect();
                }
            }

            return;
        }

        ui[eventType](resp.socket, payload, respFunc);
    });

    //###########################################################################

    //disconnect can not be caught by the "catch all" handler
    socketType === "client" && socket.on("disconnect", function(msg, resp)
    {
        var uiSocket = getUiSocketByClientSocket(socket);

        logger.error("client disconnected");

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

    socketType === "client" && socket.on('*', function(msg)
    {
        var client =
        {
            'client:data': function(msg, resp)
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
            },
            //-------------------------------------------------------------------------------------
            'client:live-stream': function(msg, resp)
            {
                logger.info("got image from client @ " + msg.date);
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
                    date: msg.date,
                    image: msg.image
                });
            }
        };

        //-------------------------------------------------------------------------------------

        var eventType = msg.data[0];
        var payload = msg.data[1];
        var respFunc = msg.data[2];

        client[eventType](payload, respFunc);
    });
});

io = io.listen(server, ssl_object);

//---------------------------------------------------------------------------