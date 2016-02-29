IoT.controller('IoTMaintenanceCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory)
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
            href: "#maintenance/" + $routeParams.client_id,
            active: true
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

    $scope.restart = function()
    {
        console.log("restart!");

        var restart = {
            mode: "restart"
        };

        SocketFactory.send("ui:maintenance", restart);
    };

    $scope.shutdown = function()
    {
        console.log("shutdown!");

        var shutdown = {
            mode: "shutdown"
        };

        SocketFactory.send("ui:maintenance", shutdown);
    };

    $scope.getMaintenanceInfo = function()
    {
        console.log("fetching maintenance info");

        SocketFactory.send('ui:maintenance-info', {}, function(err, infotext, syslogentries, logfileText)
        {
            if (!err)
            {
                $scope.infotext = infotext;

                $scope.logfile = [];

                logfileText.forEach(function(l)
                {
                    var logEntry = {};

                    logEntry.loglevel = l.level;

                    switch (logEntry.loglevel)
                    {
                        case "info":
                            logEntry.icon = "fa fa-info-circle";
                            break;
                        case "warn":
                        case "error":
                            logEntry.icon = "fa fa-warning";
                            break;
                         default:
                             logEntry.icon = "si si-question";
                    }

                    logEntry.message = l.message;
                    logEntry.created = moment(l.timestamp).format("DD.MM. HH:mm:ss");

                    $scope.logfile.push(logEntry);
                });

                syslogentries.forEach(function(s)
                {
                    switch (s.loglevel)
                    {
                        case "info":
                            s.icon = "fa fa-info-circle";
                            break;
                        case "warning":
                        case "error":
                            s.icon = "fa fa-warning";
                            break;
                        case "success":
                            s.icon = "fa fa-check-circle";
                            break;
                        default:
                            s.icon = "si si-question";
                    }

                    if (s.clientname)
                    {
                        s.loglevel = "client " + s.loglevel;
                    }
                    else if (s.globalscope)
                    {
                        s.loglevel = "global " + s.loglevel;
                    }
                });

                $scope.syslogentries = syslogentries;

                $scope.$apply();

                //loaded
                setTimeout(function()
                {
                    $(".block-opt-refresh").removeClass("block-opt-refresh");
                }, 300);
            }
            else
            {
                SocketFactory.callLifecycleCallback("functional_error", "Error generating maintenance info: " + err);
            }
        });
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: Maintenance";
        $rootScope.subHeadline = "See Recent Activities And Logs";

        $scope.connect(false, function()
        {
            $scope.getMaintenanceInfo();
        });
    };

    //-----------------------------------------------------

    $scope.init();
});