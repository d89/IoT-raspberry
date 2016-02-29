IoT.controller('IoTVideoCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory)
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
            href: "#video/" + $routeParams.client_id,
            active: true
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
                $scope.getVideos(function()
                {
                    $scope.videos.length && $scope.play($scope.videos[0].fileName);
                });
            }
        });
    };

    $scope.play = function(videoName)
    {
        console.log("playing video ", videoName);
        $scope.playingVideo = true;
        $scope.videoUrl = "/video/" + videoName;
        $scope.videoParams = "?client=" + SocketFactory.clientName + "&password=" + constant.get("password");
    };

    $scope.getVideos = function(cb)
    {
        $scope.loading = true;

        var options = {
            password: constant.get("password"),
            client: SocketFactory.clientName
        };

        console.info("sent get video request", options);

        $.post("/videos/get", options, function(videoResponse)
        {
            videoResponse = JSON.parse(videoResponse);

            console.log("videos", videoResponse);

            var videos = [];

            videoResponse.forEach(function(v)
            {
                var videoParts = v.split("-");
                var videoDate = moment(videoParts[1] + " " + videoParts[2]).format("DD.MM.YYYY HH:mm:ss");

                videos.push({
                    fileName: v,
                    fileDate: videoDate
                })
            });

            $scope.videos = videos;
            $scope.loading = false;
            if (cb) cb();
        }).fail(function(err)
        {
            console.error(err);
            SocketFactory.callLifecycleCallback("functional_error", "Could not load videos");
            return;
        });
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: Video";
        $rootScope.subHeadline = "Watch Camera Videos";

        $scope.connect(false, function()
        {
            $scope.getVideos(function()
            {
                var autoplay = $routeParams.autoplay;

                if (autoplay && $scope.videos.length)
                {
                    $scope.play($scope.videos[0].fileName);
                }
            });
        });
    };

    //-----------------------------------------------------

    $scope.init();
});