IoT.controller('IoTIndexCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, PushFactory)
{
    //-----------------------------------------------------

    $rootScope.showLogout = false;

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

    $scope.randImage = (function()
    {
        var randomIntFromInterval = function(min, max)
        {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        return randomIntFromInterval(1, 27);
    })();

    $scope.getClients = function(cb)
    {
        $.get("/clients/get", function(clients)
        {
            cb(JSON.parse(clients));
        });
    };

    $scope.performLogin = function(id)
    {
        var pw = $("a[data-client-name='" + id + "'] .password-input").val();

        if (pw.length)
        {
            var shaObj = new jsSHA("SHA-512", "TEXT");
            shaObj.update(pw);
            pw = shaObj.getHash("HEX");
            localStorage.setItem(id, pw);

            $scope.loadDashboard(id);
        }
    };

    $scope.cancelLogin = function(id)
    {
        var loginMask = $("a[data-client-name='" + id + "'] .login-mask");
        loginMask.fadeOut("fast");
    };

    $scope.loadDashboard = function(id)
    {
        var pw = localStorage.getItem(id);

        if (!pw)
        {
            $("a[data-client-name='" + id + "'] .login-mask").show();
            $("a[data-client-name='" + id + "'] .password-input").select();
            return;
        }

        $routeParams.client_id = id;

        $scope.connect(true, function()
        {
            $rootScope.$apply(function()
            {
                $location.path('/dashboard/' + id);
            });
        });
    };

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal";
        $rootScope.subHeadline = "Currently connected IoT Devices";
        $rootScope.hideStats = true;

        $scope.clients = [];

        PushFactory.registerPush();

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

    //-----------------------------------------------------

    $scope.init();
});