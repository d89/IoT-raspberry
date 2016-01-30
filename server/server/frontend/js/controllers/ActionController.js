IoT.controller('IoTActionCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, IoTFactory)
{
    //-----------------------------------------------------

    $rootScope.sidebar =
    {
        "Sensor Data":
        [{
            title: "Dashboard",
            href: "#dashboard/" + $routeParams.client_id
        },
        {
            title: "History",
            href: "#history/" + $routeParams.client_id
        }],
        "Actions":
        [{
            title: "Action",
            href: "#action/" + $routeParams.client_id,
            active: true
        },
        {
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id
        }],
        "Device Overview":
        [{
            title: "Connected Devices",
            href: "#index"
        }]
    };

    //-----------------------------------------------------

    $scope.$on('$routeChangeStart', function(next, current)
    {
        //user leaves this page - if stream is still running: stop it.
        $scope.stopStream();
    });

    //-----------------------------------------------------

    $scope.streamActive = false;

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

        IoTFactory.socket.emit("ui:action", rc);
    };

    $scope.servo = function(onoff)
    {
        onoff = !!onoff;

        console.log("acting with servo ", onoff);

        var servo = {
            type: "servo",
            data: {
                onoff: onoff
            }
        };

        IoTFactory.socket.emit("ui:action", servo);
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

        IoTFactory.socket.emit("ui:action", led);
    };

    $scope.startStream = function()
    {
        $scope.streamActive = true;
        $scope.streamTime = "Initialzing Camera";
        $("#stream").attr("src", "assets/img/various/loading-cam.gif");

        IoTFactory.socket.emit('ui:start-stop-stream', {
            start: true
        });
    };

    $scope.stopStream = function()
    {
        console.log("stopping stream!");

        $scope.streamActive = false;
        $scope.streamTime = "Shutting Down Stream";

        IoTFactory.socket.emit('ui:start-stop-stream', {
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
        $rootScope.mainHeadline = "IoT Portal: Actions";
        $rootScope.subHeadline = "Trigger Actions On Your IoT device";
        $scope.connect(false, function()
        {
            IoTFactory.socket.on("cam-stream", function(msg)
            {
                var image = msg.image;
                var date = msg.date;

                $('#stream').attr('src', 'data:image/jpg;base64,' + image);
                $scope.streamTime = "Now: " + moment().format("HH:mm:ss") + " | " + "Img: " + moment(date).format("HH:mm:ss");
            });
        });
    };

    //-----------------------------------------------------

    $scope.init();
});