IoT.controller('IoTActionCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory)
{
    //-----------------------------------------------------

    $rootScope.showLogout = true;

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
            title: "If This, Then That",
            href: "#ifttt/" + $routeParams.client_id
        },
        {
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id
        },
        {
            title: "Video",
            href: "#video/" + $routeParams.client_id
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

        SocketFactory.send("ui:action", rc);
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

        SocketFactory.send("ui:action", servo);
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

        SocketFactory.send("ui:action", led);
    };

    $scope.startStream = function()
    {
        $scope.streamActive = true;
        $scope.streamTime = "Initializing Camera";
        $("#stream").attr("src", "assets/img/various/loading-cam.gif");

        SocketFactory.send('ui:start-stop-stream', {
            start: true
        }, function(err, msg)
        {
            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not start stream: " + err);
                $scope.streamActive = false;
                return;
            }
        });
    };

    $scope.music = function()
    {
        var res = window.prompt("Please enter the file name of music to be played or the full youtube video to be played.", "siren.mp3");
        if (!res) return;

        var options = {
            type: "music",
            data: res
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.stopMusic = function()
    {
        var options = {
            type: "music",
            data: false
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.voice = function()
    {
        var res = window.prompt("Please enter the text to be spoken out loud.", "Hello, dude!");
        if (!res) return;

        var options = {
            type: "voice",
            data: res
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.zwaveTemp = function()
    {
        var res = window.prompt("Please enter the desired temperature", "26");
        if (!res) return;

        var options = {
            type: "settemperature",
            data: {
                type: "zwave",
                temp: res,
                thermostat: "ZWave_THERMOSTAT_11"
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.homematicTemp = function()
    {
        var res = window.prompt("Please enter the desired temperature", "26");
        if (!res) return;

        var options = {
            type: "settemperature",
            data: {
                type: "homematic",
                temp: res,
                thermostat: "HM_37F678"
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.stopStream = function()
    {
        console.log("stopping stream!");

        $scope.streamActive = false;
        $scope.streamTime = "Shutting Down Stream";

        SocketFactory.send('ui:start-stop-stream', {
            start: false
        }, function(err, msg)
        {
            console.log("stop stream answer", err, msg);
        });
    };

    $scope.singleColor = function(red, green, blue)
    {
        console.log("sending color", red, green, blue);
        
        var options = {
            type: "ledstrip",
            data: {
                mode: "singleColor",
                colors: {
                    red: red,
                    green: green,
                    blue: blue
                }
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.colorParty = function()
    {
        var options = {
            type: "ledstrip",
            data: {
                mode: "colorParty"
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.allOff = function()
    {
        var options = {
            type: "ledstrip",
            data: {
                mode: "allOff"
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.randomColor = function()
    {
        var options = {
            type: "ledstrip",
            data: {
                mode: "randomColor"
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.lightshow = function()
    {
        var res = window.prompt("Please enter the file name of music to be played or the full link to the youtube video.", "house.mp3");
        if (!res) return;

        var options = {
            type: "ledstrip",
            data: {
                mode: "lightshow",
                file: res
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.video = function()
    {
        $scope.videoActive = constant.get("camRecordingDuration");

        SocketFactory.send('ui:start-video', { duration: constant.get("camRecordingDuration") }, function(err, msg)
        {
            $scope.videoActive = false;
            console.log("done recording video", err, msg);

            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not record video: " + err);
            }
            else
            {
                $location.path('/video/' + $routeParams.client_id + "/autoplay");
            }
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
        $scope.rgbPicker = "rgb(30,112,23)";

        $scope.$on('colorpicker-selected', function(event, colorObject)
        {
            var rgb = colorObject.value.match(/(\d+)/g);
            $scope.singleColor(rgb[0], rgb[1], rgb[2]);
        });

        $scope.connect(false, function()
        {
            SocketFactory.receive("cam-stream", function(msg)
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