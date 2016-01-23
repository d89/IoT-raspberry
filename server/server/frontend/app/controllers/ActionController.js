IoT.controller('IoTActionCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, constant)
{
    //-----------------------------------------------------

    $scope.templateLoadCount = 0;

    $rootScope.$on('$includeContentLoaded', function()
    {
        if (++$scope.templateLoadCount >= 4)
        {
            Styles.init();
        }
    });

    //-----------------------------------------------------

    $scope.socket = null;
    $scope.clientMessages = 0;
    $scope.streamActive = false;

    $scope.getCount = function()
    {
        console.log("requesting count");

        $scope.count = "Loading count";

        $scope.socket.emit('ui:data-count', {}, function(err, resp)
        {
            if (err)
            {
                $scope.count = err;
            }
            else
            {
                $scope.count = resp;
            }

            $scope.$apply();
        });
    };

    $scope.connectToDevice = function(id)
    {
        if ($scope.socket)
        {
            $scope.socket.disconnect();
        }

        $scope.socket = io.connect(constant("serverUrl"), { query: "mode=ui&client=" + id });

        $scope.socket.on("connect", function()
        {
            console.log("connected!");
        });

        $scope.socket.on("client-disconnected", function(data)
        {
            alert("client " + data.id + " disconnected!");
        });

        $scope.socket.on("disconnect", function()
        {
            alert("server disconnected!");
        });

        $scope.socket.on("dataupdate", function(msg)
        {
            $scope.clientMessages++;
            $scope.$apply();
        });

        $scope.socket.on("cam-stream", function(msg)
        {
            var image = msg.image;
            var date = msg.date;

            $('#stream').attr('src', 'data:image/jpg;base64,' + image);
            $scope.streamTime = "Now: " + moment().format("HH:mm:ss") + " | " + "Img: " + moment(date).format("HH:mm:ss");
        });

        $scope.socket.emit('ui:get-socket-info', {}, function(err, resp)
        {
            if (err)
            {
                $scope.client_name = err;
            }
            else
            {
                $scope.clientName = resp.client_name;
                $scope.connectedAt = moment(new Date(resp.connected_at)).format("DD.MM. HH:mm:ss").toString();
            }

            $scope.$apply();
        });
    };

    //-----------------------------------------------------

    $scope.sidebar = [
        {
            title: "Dashboard",
            href: "#dashboard/" + $routeParams.client_id
        },
        {
            title: "History",
            href: "#history/" + $routeParams.client_id
        },
        {
            title: "Action",
            href: "#action/" + $routeParams.client_id,
            active: true
        },
        {
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id
        },
        {
            title: "Connected Devices",
            href: "#index"
        }
    ];

    //-----------------------------------------------------

    $scope.rcSwitch = function(nr, state)
    {
        var text = "Turning " + (state ? "on" : "off") + " rc switch " + nr;
        console.log(text);

        var rc = {
            type:"switchrc",
            data: {
                switchNumber: nr,
                onoff: state
            }
        };

        $scope.socket.emit("ui:action", rc);
    };

    $scope.led = function(nr)
    {
        var ledColor = (nr == 1 ? "red" : "green");
        console.log("enabling led " + ledColor);

        var led = {
            type: "led",
            data: {
                ledType: ledColor
            }
        };

        $scope.socket.emit("ui:action", led);
    };

    $scope.startStream = function()
    {
        $scope.streamActive = true;
        $scope.streamTime = "Initialzing Camera";
        $("#stream").attr("src", "assets/img/various/loading-cam.gif");

        $scope.socket.emit('ui:start-stop-stream', {
            start: true
        });
    };

    $scope.stopStream = function()
    {
        $scope.streamActive = false;
        $scope.streamTime = "Shutting Down Stream";

        $scope.socket.emit('ui:start-stop-stream', {
            start: false
        });
    };

    $scope.camera = function(state)
    {
        console.log("activating camera: " + state);

        if (!state)
        {
            $scope.stopStream();
        }
        else
        {
            $scope.startStream();
        }
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $scope.connectToDevice($routeParams.client_id);
        $scope.getCount();
    };

    $scope.init();
});