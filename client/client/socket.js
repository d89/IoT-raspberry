//---------------------------------------------------------------------------

var io = require('socket.io-client');
var config = require('./config');
var logger = require('./logger');
var crypto = require('crypto');

exports.serverUrl = config.serverUrl;
exports.clientName = config.clientName;

exports.getConnectionHandle = function()
{
    var connectionParams = [];
    connectionParams.push("mode=client");
    connectionParams.push("password=" + crypto.createHash('sha512').update(config.password).digest('hex'));
    connectionParams.push("connected_at=" + (new Date));
    connectionParams.push("client_name=" + exports.clientName);
    connectionParams.push("capabilities=" + JSON.stringify(config.chartTypes));

    return io.connect(exports.serverUrl, {query: connectionParams.join("&") });
};


exports.socket = exports.getConnectionHandle();

