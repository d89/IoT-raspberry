IoT.controller('IoTIndexCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant)
{
    //-----------------------------------------------------

    $rootScope.sidebar =
    {
        "Device Overview":
        [{
            title: "Connected Devices",
            href: "#index",
            active: true
        }]
    };

    //-----------------------------------------------------

    $scope.clients = [];

    $scope.getClients = function(cb)
    {
        $.get("/clients/get", function(clients)
        {
            cb(JSON.parse(clients));
        });
    };

    $scope.loadDashboard = function(id)
    {
        $routeParams.client_id = id;

        $scope.connect(true, function()
        {
            $location.path('/dashboard/' + id);
        });
    };

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal";
        $rootScope.subHeadline = "Currently connected IoT Devices";
        $rootScope.hideStats = true;

        $scope.clients = [];

        $scope.getClients(function(clients)
        {
            for (var i = 0; i < clients.length; i++)
            {
                $scope.clients.push({
                    id: clients[i].id,
                    client_name: clients[i].client_name,
                    address: clients[i].address,
                    connected_at: moment(new Date(clients[i].connected_at)).format("DD.MM. HH:mm:ss").toString()
                });

                $scope.$apply();
            }
        });

        $scope.errorMessageQuery();
    };

    //-----------------------------------------------------

    $scope.init();
});