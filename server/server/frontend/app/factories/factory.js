IoT.factory('IoTFactory', function(constant)
{
    var IoT = {};

    IoT.socket = null;
    IoT.clientMessages = 0;
    IoT.stats = {};

    IoT.getCount = function(cb)
    {
        console.log("requesting count");

        IoT.count = "Loading count";

        IoT.socket.emit('ui:data-count', {}, function(err, resp)
        {
            if (err)
            {
                IoT.count = err;
            }
            else
            {
                IoT.count = resp;
            }

            return cb(IoT.count);
        });
    };

    //------------------------------------------------------------

    IoT.handleDisconnect = function() {};
    IoT.registerDisconnectHandler = function(onDisconnect)
    {
        console.log("!!!!!!!!!!!!!!!!!!!!! registering disconnect handler");
        IoT.handleDisconnect = onDisconnect;
    };

    IoT.handleSocketInfo = function() {};
    IoT.registerSocketInfoHandler = function(onSocketInfo)
    {
        IoT.handleSocketInfo = onSocketInfo;
    };

    IoT.handleDataUpdate =  function() {};
    IoT.registerDataUpdateHandler = function(onDataUpdate)
    {
        IoT.handleDataUpdate = onDataUpdate;
    };

    IoT.isConnected = function()
    {
        return IoT.socket !== null;
    };

    //------------------------------------------------------------

    IoT.connectToDevice = function(id, onConnected)
    {
        if (IoT.isConnected())
        {
            //IoT.socket.disconnect();
        }

        IoT.socket = io.connect(constant("serverUrl"), { query: "mode=ui&client=" + id });

        IoT.socket.on("connect", function()
        {
            if (onConnected)
                onConnected();
        });

        IoT.socket.on("client-disconnected", function(data)
        {
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! CLIENT DISCONNECT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            IoT.handleDisconnect(true);
        });

        IoT.socket.on("disconnect", function()
        {
            IoT.handleDisconnect(false);
        });

        IoT.socket.on("progress", function(data)
        {
            console.log("onprogress " + data.progress);
        });

        IoT.socket.on("dataupdate", function(msg)
        {
            IoT.clientMessages++;

            IoT.handleDataUpdate(msg, IoT.clientMessages);
        });

        IoT.socket.emit('ui:get-socket-info', {}, function(err, resp)
        {
            if (err)
            {
                return IoT.handleSocketInfo(err);
            }
            else
            {
                IoT.clientName = resp.client_name;
                IoT.connectedAt = moment(new Date(resp.connected_at)).format("DD.MM. HH:mm:ss").toString();
            }

            return IoT.handleSocketInfo(null, IoT.clientName, IoT.connectedAt);
        });
    };

    return IoT;
});