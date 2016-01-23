IoT.controller('IoTMaintenanceCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, constant)
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
            href: "#action/" + $routeParams.client_id
        },
        {
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id,
            active: true
        },
        {
            title: "Connected Devices",
            href: "#index"
        }
    ];

    //-----------------------------------------------------

    $scope.restart = function()
    {
        console.log("restart!");

        var restart = {
            mode: "restart"
        };

        $scope.socket.emit("ui:maintenance", restart);
    };

    $scope.shutdown = function()
    {
        console.log("shutdown!");

        var shutdown = {
            mode: "shutdown"
        };

        $scope.socket.emit("ui:maintenance", shutdown);
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $scope.connectToDevice($routeParams.client_id);
        $scope.getCount();
    };

    $scope.init();
});