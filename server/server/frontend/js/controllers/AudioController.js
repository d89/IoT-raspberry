IoT.controller('IoTAudioCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory)
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
            href: "#action/" + $routeParams.client_id
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
            href: "#audio/" + $routeParams.client_id,
            active: true
        }],
        "Device Overview":
        [{
            title: "Connected Devices",
            href: "#index"
        }]
    };

    $scope.deleteFile = function(fileName)
    {
        $("#audiocontainer").addClass("block-opt-refresh");

        SocketFactory.send('ui:audio', { mode: "delete", file: fileName }, function(err, msg)
        {
            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not delete audio: " + err);
            }
            else
            {
                console.log("file deleted");
                $scope.loadAudios();
            }
        });
    };

    $scope.playAudio = function(fileName)
    {
        $location.path('/action/' + $routeParams.client_id + "/audio/" + fileName);
    };

    $scope.playLightshow = function(fileName)
    {
        $location.path('/action/' + $routeParams.client_id + "/lightshow/" + fileName);
    };

    $scope.loadAudios = function(onsuccess)
    {
        $("#audiocontainer").addClass("block-opt-refresh");

        SocketFactory.send('ui:audio', { mode: "list" }, function(err, audios)
        {
            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not list audio: " + err);
            }
            else
            {
                console.log("got audio", audios);

                for (var i = 0; i < audios.length; i++)
                {
                    audios[i].date = moment(audios[i].date).format("DD.MM.YYYY HH:mm:ss");
                }

                $scope.audios = audios;

                setTimeout(function()
                {
                    $("#audiocontainer").removeClass("block-opt-refresh");
                    if (onsuccess) onsuccess();
                }, 500);
            }
        });
    };

    $scope.youtube = function(ytid)
    {
        var options = {
            type: "youtube",
            data: ytid
        };

        SocketFactory.send("ui:action", options);
    };

    $scope.youtubeProgress = function(msg)
    {
        if (msg.output)
        {
            $scope.youtubeProgressMessage("info", msg.output);
        }
        else if ("success" in msg)
        {
            var isSuccess = msg.success;
            var file = msg.file;

            if (isSuccess)
            {
                $scope.youtubeProgressMessage("success", "Successfully downloaded file " + file);

                console.log("is success");
                $scope.loadAudios(function()
                {
                    Styles.hightlightScroll($("[data-filename='" + Styles.escapeStringForSelector(file) + "']"));
                });
            }
            else
            {
                $scope.youtubeProgressMessage("error", "Error downloading!");
            }

            $scope.downloading = false;
        }

        $scope.$apply();
    };

    $scope.youtubeProgressMessage = function(level, text)
    {
        if (!$scope.youtubeLog) $scope.youtubeLog = [];

        $scope.youtubeLog.unshift({
            text: text,
            date: moment().format("HH:mm:ss"),
            type: level
        });
    };

    $scope.checkAutoPlay = function()
    {
        var track = $routeParams.track;
        var ytid = $routeParams.ytid;

        if (ytid)
        {
            $scope.downloading = true;

            console.log("starting youtube download");
            $scope.youtubeProgressMessage("info", "Starting Youtube Download");
            $scope.youtube(ytid);
        }
        else if (track)
        {
            setTimeout(function()
            {
                var element = $("[data-filename='" + Styles.escapeStringForSelector(track) + "']");
                Styles.hightlightScroll(element);
            }, 500);
        }
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: Audio";
        $rootScope.subHeadline = "Play Audio";

        $scope.connect(false, function()
        {
            console.log("is connection");
            $scope.loadAudios(function()
            {
                $scope.checkAutoPlay();
            });

            //register youtube download status
            SocketFactory.registerLifecycleCallback("youtube-download", function(msg)
            {
                $scope.youtubeProgress(msg);
            }, "yt");
        });
    };

    //-----------------------------------------------------

    $scope.init();
});