IoT.controller('IoTMaintenanceCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, IoTFactory)
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
            href: "#action/" + $routeParams.client_id
        },
        {
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id,
            active: true
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

        IoTFactory.socket.emit("ui:maintenance", restart);
    };

    $scope.shutdown = function()
    {
        console.log("shutdown!");

        var shutdown = {
            mode: "shutdown"
        };

        IoTFactory.socket.emit("ui:maintenance", shutdown);
    };

    $scope.getMaintenanceInfo = function()
    {
        console.log("fetching maintenance info");

        IoTFactory.socket.emit('ui:maintenance-info', {}, function(err, infotext, syslogentries)
        {
            if (!err)
            {
                $scope.infotext = infotext;

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
                });

                $scope.syslogentries = syslogentries;

                //loaded
                setTimeout(function()
                {
                    $(".block-opt-refresh").removeClass("block-opt-refresh");
                }, 1500);

            }
            else
            {
                alert("Error generating maintenance info: " + err);
            }
        });
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: Maintenance";
        $rootScope.subHeadline = "See Recent Activities And Logs";

        //TODO what if connection is not possible?
        $scope.connect(false, function()
        {
            $scope.getMaintenanceInfo();
        });
    };

    //-----------------------------------------------------

    $scope.init();
});