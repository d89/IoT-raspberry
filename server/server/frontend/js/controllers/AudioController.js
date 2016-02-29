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
            $scope.youtubeLog.unshift({
                text: msg.output,
                date: moment().format("HH:mm:ss"),
                type: "info"
            });
        }
        else if ("success" in msg)
        {
            var isSuccess = msg.success;
            var file = msg.file;

            if (isSuccess)
            {
                $scope.youtubeLog.unshift({
                    text: "Successfully downloaded file " + file,
                    date: moment().format("HH:mm:ss"),
                    type: "success"
                });

                $scope.loadAudios(function()
                {
                    Styles.hightlightScroll($("[data-filename='" + file + "']"));
                });
            }
            else
            {
                $scope.youtubeLog.unshift({
                    text: "Error downloading!",
                    date: moment().format("HH:mm:ss"),
                    type: "error"
                });
            }

            $scope.downloading = false;
        }

        $scope.$apply();
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: Audio";
        $rootScope.subHeadline = "Play Audio";

        $scope.connect(false, function()
        {
            $scope.loadAudios();

            //register youtube download status
            SocketFactory.registerLifecycleCallback("youtube-download", function(msg)
            {
                $scope.youtubeProgress(msg);
            });

            //check auto play
            var ytid = $routeParams.ytid;

            if (ytid)
            {
                $scope.downloading = true;

                console.log("starting youtube download");

                $scope.youtubeLog = [{
                    text: "Starting Youtube Download",
                    date: moment().format("HH:mm:ss"),
                    type: "info"
                }];

                $scope.youtube(ytid);
            }
        });
    };

    //-----------------------------------------------------

    $scope.init();
});