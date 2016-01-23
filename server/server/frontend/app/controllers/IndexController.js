IoT.controller('IoTIndexCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, constant)
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

    $scope.clients = [];

    $scope.sidebar = [
        {
            title: "Connected Devices",
            href: "#index",
            active: true
        }
    ];

    $scope.getClients = function(cb)
    {
        $.get("/clients/get", function(clients)
        {
            cb(JSON.parse(clients));
        });
    };

    $scope.init = function()
    {
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
    };

    $scope.init();
});