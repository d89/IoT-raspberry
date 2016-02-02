IoT.factory('SocketFactory', function(constant)
{
    var SocketFactory = {};

    SocketFactory.socket = null;
    SocketFactory.clientMessages = 0;
    SocketFactory.stats = {};

    SocketFactory.getCount = function(cb)
    {
        console.log("requesting count - 0");

        SocketFactory.count = "Loading count";

        SocketFactory.socket.emit('ui:data-count', {}, function(err, resp)
        {
            console.log("data count response - 1");

            if (err)
            {
                console.log("data count error - 2");
                return cb(err);
            }

            SocketFactory.count = resp;

            return cb(null, SocketFactory.count);
        });
    };

    //------------------------------------------------------------

    SocketFactory.lifecycleCallbacks = {};

    SocketFactory.registerLifecycleCallback = function(eventType, callback)
    {
        if (!SocketFactory.lifecycleCallbacks[eventType])
        {
            SocketFactory.lifecycleCallbacks[eventType] = [];
        }

        SocketFactory.lifecycleCallbacks[eventType].push(callback);
    };

    SocketFactory.callLifecycleCallback = function(eventType)
    {
        if (!SocketFactory.lifecycleCallbacks[eventType])
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

        SocketFactory.lifecycleCallbacks[eventType].forEach(function(cb)
        {
            cb.apply(this, parameters);
        })
    };

    SocketFactory.resetLifecycleCallbacks = function()
    {
        SocketFactory.lifecycleCallbacks = {};
    };

    //------------------------------------------------------------

    SocketFactory.isConnected = function()
    {
        var isConnected = SocketFactory.socket !== null && SocketFactory.socket.connected === true;

        console.log("is connected", isConnected);

        return isConnected;
    };

    //------------------------------------------------------------

    SocketFactory.connectToDevice = function(id, cb)
    {
        if (SocketFactory.isConnected())
        {
            //SocketFactory.socket.disconnect();
        }

        SocketFactory.socket = io.connect(constant("serverUrl"), {
            reconnect: true,
            query: "mode=ui&client=" + id,
            'connect timeout': 1000,
            'reconnection delay': 100,
            'sync disconnect on unload': false,
            'max reconnection attempts': Infinity
        });

        SocketFactory.socket.on("connect", function()
        {
            if (cb)
                cb(null, true);
        });

        var socketEvents = [ 'connect', 'disconnect', 'connecting', 'connect_failed', 'close', 'reconnect', 'reconnecting', 'reconnect_failed' ];

        socketEvents.forEach(function(s)
        {
            (function(eventName)
            {
                SocketFactory.socket.on(s, function(ev)
                {
                    console.log(new Date() + " ======================== SOCKET EVENT: " + eventName + " ========================", ev);
                });
            }(s));

        });

        SocketFactory.socket.on('connect_error', function()
        {
            console.log('Connection failed');

            if (cb)
                cb('Connection failed');
        });

        SocketFactory.socket.on("client-disconnected", function(data)
        {
            console.log("DISCONNECT client disconnect event!");
            SocketFactory.callLifecycleCallback("disconnect", true);
        });

        SocketFactory.socket.on("disconnect", function()
        {
            console.log("DISCONNECT server event");
            SocketFactory.callLifecycleCallback("disconnect", false);
        });

        SocketFactory.socket.on("progress", function(data)
        {
            console.log("onprogress " + data.progress);
        });

        SocketFactory.socket.on("dataupdate", function(msg)
        {
            console.log(new Date() + " ======================== SOCKET DATA RECEIVED ========================");
            SocketFactory.clientMessages++;

            SocketFactory.callLifecycleCallback("dataupdate", msg, SocketFactory.clientMessages);
        });

        SocketFactory.socket.emit('ui:get-socket-info', {}, function(err, resp)
        {
            if (err)
            {
                return SocketFactory.callLifecycleCallback("socketinfo", err);
            }
            else
            {
                SocketFactory.clientName = resp.client_name;
                SocketFactory.connectedAt = moment(new Date(resp.connected_at)).format("DD.MM. HH:mm:ss").toString();
            }

            return SocketFactory.callLifecycleCallback("socketinfo", null, SocketFactory.clientName, SocketFactory.connectedAt);
        });
    };

    return SocketFactory;
});