IoT.factory('IoTFactory', function(constant)
{
    var IoT = {};

    IoT.socket = null;
    IoT.clientMessages = 0;
    IoT.stats = {};

    IoT.getCount = function(cb)
    {
        console.log("requesting count - 0");

        IoT.count = "Loading count";

        IoT.socket.emit('ui:data-count', {}, function(err, resp)
        {
            console.log("data count response - 1");

            if (err)
            {
                console.log("data count error - 2");
                return cb(err);
            }

            IoT.count = resp;

            return cb(null, IoT.count);
        });
    };

    //------------------------------------------------------------

    IoT.lifecycleCallbacks = {};

    IoT.registerLifecycleCallback = function(eventType, callback)
    {
        if (!IoT.lifecycleCallbacks[eventType])
        {
            IoT.lifecycleCallbacks[eventType] = [];
        }

        IoT.lifecycleCallbacks[eventType].push(callback);
    };

    IoT.callLifecycleCallback = function(eventType)
    {
        if (!IoT.lifecycleCallbacks[eventType])
        {
            console.log("no handler for lifecycle " + eventType);
            return;
        }

        //remove first parameter from arguments list
        var parameters = [];

        for (var i = 1; i < arguments.length; i++)
        {
            parameters.push(arguments[i]);
        }

        if (eventType != "dataupdate")
            console.log("called lifecycle callback for " + eventType, parameters);

        IoT.lifecycleCallbacks[eventType].forEach(function(cb)
        {
            cb.apply(this, parameters);
        })
    };

    IoT.resetLifecycleCallbacks = function()
    {
        IoT.lifecycleCallbacks = {};
    };

    //------------------------------------------------------------

    IoT.isConnected = function()
    {
        var isConnected = IoT.socket !== null && IoT.socket.connected === true;

        console.log("is connected", isConnected);

        return isConnected;
    };

    //------------------------------------------------------------

    IoT.connectToDevice = function(id, cb)
    {
        if (IoT.isConnected())
        {
            //IoT.socket.disconnect();
        }

        IoT.socket = io.connect(constant("serverUrl"), { query: "mode=ui&client=" + id });

        IoT.socket.on("connect", function()
        {
            if (cb)
                cb(null, true);
        });

        IoT.socket.on('connect_error', function()
        {
            console.log('Connection failed');

            if (cb)
                cb('Connection failed');
        });

        IoT.socket.on('reconnect_failed', function()
        {
            console.log('Reconnection failed');

            if (cb)
                cb('Reconnection failed');
        });

        IoT.socket.on("client-disconnected", function(data)
        {
            IoT.callLifecycleCallback("disconnect", true);
        });

        IoT.socket.on("disconnect", function()
        {
            IoT.callLifecycleCallback("disconnect", false);
        });

        IoT.socket.on("progress", function(data)
        {
            console.log("onprogress " + data.progress);
        });

        IoT.socket.on("dataupdate", function(msg)
        {
            IoT.clientMessages++;

            IoT.callLifecycleCallback("dataupdate", msg, IoT.clientMessages);
        });

        IoT.socket.emit('ui:get-socket-info', {}, function(err, resp)
        {
            if (err)
            {
                return IoT.callLifecycleCallback("socketinfo", err);
            }
            else
            {
                IoT.clientName = resp.client_name;
                IoT.connectedAt = moment(new Date(resp.connected_at)).format("DD.MM. HH:mm:ss").toString();
            }

            return IoT.callLifecycleCallback("socketinfo", null, IoT.clientName, IoT.connectedAt);
        });
    };

    return IoT;
});