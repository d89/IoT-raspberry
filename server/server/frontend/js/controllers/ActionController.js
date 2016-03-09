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
        },
        {
            title: "Audio",
            href: "#audio/" + $routeParams.client_id
        }],
        "Device Overview":
        [{
            title: "Connected Devices",
            href: "#index"
        }]
    };

    //-----------------------------------------------------

    //from http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
    var ytIdExtractor = function(url) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = url.match(regExp);
        return (match&&match[7].length==11)? match[7] : false;
    };

    //-----------------------------------------------------

    $scope.$on('$routeChangeStart', function(next, current)
    {
        //user leaves this page - if stream is still running: stop it.
        $scope.stopStream();
    });

    //-----------------------------------------------------

    $scope.streamActive = false;

    $scope.zwaveSwitch = function(state)
    {
        var switchName = window.prompt("Please enter the ID of the switch", "ZWave_SWITCH_BINARY_17");
        if (!switchName) return;

        var options = {
            type: "switchzwave",
            data: {
                onoff: !!state,
                switchName: switchName
            }
        };

        SocketFactory.send("ui:action", options);
    };

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

    $scope.volume = function()
    {
        var volumeSetting = localStorage.getItem("volume") || 70;

        var volume = window.prompt("Please enter sound volume between 0 (silent) and 100 (loudest).", volumeSetting);

        if (!volume) return;

        localStorage.setItem("volume", volume);

        var options = {
            type: "volume",
            data: volume
        };

        SocketFactory.send("ui:action", options);
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

    $scope.stepper = function(onoff)
    {
        onoff = !!onoff;

        console.log("acting with stepper ", onoff);

        var stepper = {
            type: "stepper",
            data: {
                onoff: onoff
            }
        };

        SocketFactory.send("ui:action", stepper);
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
        $location.path('/audio/' + $routeParams.client_id);
    };

    $scope.playMusic = function(fileName)
    {
        var options = {
            type: "music",
            data: fileName
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.lightshowSynchronize = function()
    {
        var options = {
            type: "ledstrip",
            data: {
                mode: "lightshow",
                style: "linein"
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.playLightshow = function(fileName)
    {
        var options = {
            type: "ledstrip",
            data: {
                mode: "lightshow",
                style: "music",
                file: fileName
            }
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

    $scope.startRecording = function()
    {
        var maxLength = window.prompt("Please enter the duration in seconds you want to record.", 8);

        if (!maxLength) return;

        $scope.isRecording = true;

        var recording = {
            type: "record",
            data: {
                mode: "start",
                maxLength: maxLength
            }
        };

        SocketFactory.send("ui:action", recording, function(err, title)
        {
            $scope.isRecording = false;

            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not record audio: " + err);
            }
            else
            {
                console.info("finished recording title", title);
                $location.path('/audio/' + $routeParams.client_id + '/autoplay/' + title);
            }
        });
    };

    $scope.zwaveTemp = function()
    {
        var thermostat = window.prompt("Please enter the ID of the thermostat", "ZWave_THERMOSTAT_11");
        if (!thermostat) return;

        var temp = window.prompt("Please enter the desired temperature", "26");
        if (!temp) return;

        var options = {
            type: "settemperature",
            data: {
                type: "zwave",
                temp: temp,
                thermostat: thermostat
            }
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.homematicTemp = function()
    {
        var thermostat = window.prompt("Please enter the ID of the thermostat", "HM_37F678");
        if (!thermostat) return;

        var temp = window.prompt("Please enter the desired temperature", "26");
        if (!temp) return;

        var options = {
            type: "settemperature",
            data: {
                type: "homematic",
                temp: temp,
                thermostat: thermostat
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
        $location.path('/audio/' + $routeParams.client_id);
    };

    $scope.video = function()
    {
        $location.path('/video/' + $routeParams.client_id + "/startrecording/1");
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

    $scope.checkAutoPlay = function()
    {
        var audio = $routeParams.audio;
        var lightshow = $routeParams.lightshow;

        if (audio || lightshow)
        {
            if (audio) {
                $scope.playMusic(audio);
            } else {
                $scope.playLightshow(lightshow);
            }

            setTimeout(function()
            {
                var element = audio ? $("#music") : $("#lightshow");
                Styles.hightlightScroll(element);
            }, 500);
        }
    };

    $scope.youtube = function()
    {
        var url = window.prompt("Enter full youtube link of the video to be downloaded as .mp3 file", "https://www.youtube.com/watch?v=DLzxrzFCyOs");

        if (!url) return;

        var ytid = ytIdExtractor(url);

        if (!ytid) return;

        $location.path('/audio/' + $routeParams.client_id + "/youtube-download/" + ytid);
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: Actions";
        $rootScope.subHeadline = "Trigger Actions On Your IoT device";

        var randomColor = function()
        {
            var min = 0;
            var max = 255;
            return Math.floor(Math.random()*(max-min+1)+min);
        };

        var color = [randomColor(), randomColor(), randomColor()].join(",");

        $scope.rgbPicker = "rgb(" + color + ")";

        /*
        //alternatively: much faster, but tends to overflow
        $scope.$watch('rgbPicker', function() {
            var rgb = $scope.rgbPicker.match(/(\d+)/g);
            $scope.singleColor(rgb[0], rgb[1], rgb[2]);
        });
        */

        $scope.$on('colorpicker-selected', function(event, colorObject)
        {
            //alternatively use this, but not always accurate
            //var rgb = colorObject.value.match(/(\d+)/g);
            setTimeout(function()
            {
                var rgb = $scope.rgbPicker.match(/(\d+)/g);
                $scope.singleColor(rgb[0], rgb[1], rgb[2]);
            }, 100);
        });

        $scope.connect(false, function()
        {
            $scope.checkAutoPlay();

            SocketFactory.receive("cam-stream", function(msg)
            {
                var image = msg.image;
                var date = msg.date;
                var now = msg.now;

                $('#stream').attr('src', 'data:image/jpg;base64,' + image);
                $scope.streamTime = "Now: " + moment(now).format("HH:mm:ss") + " | " + "Img: " + moment(date).format("HH:mm:ss");
            });
        });
    };

    //-----------------------------------------------------

    $scope.init();
});