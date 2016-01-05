var is_live = !(/^win/.test(process.platform));
console.log("IS IN LIVE MODE?", is_live);

//---------------------------------------------------------------------------

var fs = require('fs');
var app = require('express')();
var http = is_live ? require('https') : require('http');
var sio = require('socket.io');
const port = 3000;

//---------------------------------------------------------------------------

var ssl_object = {};

if (is_live)
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

app.get('/', function(req, res)
{
	var clients = [];
	
	io.sockets.sockets.forEach(s => (
		clients.push(`${s.id} @ ${s.client.conn.remoteAddress}`)
	));
	
	clients = clients.join("<br />");
	
	var html = `<h1>Waiting for connections on port ${port}
				<h2>Connected Clients: ${io.sockets.sockets.length}</h2>
				<p>${clients}</p>
				`;
	res.end(html);
});

io.on('connection', function(socket)
{	
	console.log(`received new connection ${socket.id} from ${socket.client.conn.remoteAddress}`);
	
	socket.on('data', function(msg)
	{
		//io.emit('chat message', msg);
		
		console.log(`got from ${socket.id}`, msg);
	});
	
	socket.on('disconnect', function(msg)
	{	
		console.log(`client ${socket.id} disconnected: ${msg}`);
	});
});

//---------------------------------------------------------------------------