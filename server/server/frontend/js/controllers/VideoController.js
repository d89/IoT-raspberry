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
        $scope.videoActive = true;

        SocketFactory.send('ui:start-video', {}, function(err, msg)
        {
            $scope.videoActive = false;
            console.log("done recording video", err, msg);

            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not record video: " + err);
            }
            else
            {
                $scope.getVideos();
            }
        });
    };

    $scope.getVideos = function(cb)
    {
        $.get("/videos/get", function(videos)
        {
            videos = JSON.parse(videos);

            console.log("videos", videos);

            $scope.videos = videos;
        });
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: Video";
        $rootScope.subHeadline = "Watch Camera Videos";

        $scope.connect(false, function()
        {
            $scope.getVideos();
        });
    };

    //-----------------------------------------------------

    $scope.init();
});