IoT.controller('IoTBaseCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, IoTFactory)
{
    $scope.errorMessageQuery = function()
    {
        if ($routeParams.error_message)
        {
            var err = $routeParams.error_message;
            var errMessage = "Unknown Error";

            if (err === "disconnect-server")
            {
                errMessage = "Disconnected from server";
            }
            else if (err === "disconnect-client")
            {
                errMessage = "Disconnected from IoT client";
            }

            $rootScope.errMessage = errMessage;

            jQuery('#modal-error').modal('toggle');
        }
    };

    $scope.dismissModal = function()
    {
        jQuery('#modal-error').modal('toggle');

        $timeout(function()
        {
            $location.path('/index');
        }, 500);
    };

    //-----------------------------------------------------

    $scope.onDisconnect = function(isClientDisconnect)
    {
        console.log("handeling disconnection");

        var err = isClientDisconnect ? "disconnect-client" : "disconnect-server";

        $rootScope.$apply(function()
        {
            var loc = $location.path('/error/' + err);
        });
    };

    $scope.onSocketInfo = function(err, clientName, connectedAt)
    {
        if (err)
        {
            IoTFactory.callLifecycleCallback("disconnect", true);
            return;
        }

        $scope.clientName = clientName;
        $scope.connectedAt = connectedAt;
    };

    $scope.onDataUpdate = function(message, messageCount)
    {
        $scope.clientMessages = messageCount;
        $scope.$apply();
    };

    //-----------------------------------------------------

    $scope.getCount = function()
    {
        IoTFactory.getCount(function(err, count)
        {
            if (err)
            {
                IoTFactory.callLifecycleCallback("disconnect", false);
                return;
            }

            $scope.count = count;
            $scope.$apply();
        });
    };

    $scope.connect = function(reconnect, connectCallback)
    {
        console.log("connect in base");

        if (reconnect)
        {
            console.log("RESETTING client message count");

            IoTFactory.clientMessages = 0;
        }

        if (IoTFactory.isConnected())
        {
            if (reconnect)
            {
                console.log("RECONNECTING!!!");
            }
            else
            {
                console.log("do not reconnect, connection already established!");

                if (connectCallback)
                    return connectCallback();

                return;
            }
        }

        IoTFactory.resetLifecycleCallbacks();
        IoTFactory.registerLifecycleCallback("disconnect", $scope.onDisconnect);
        IoTFactory.registerLifecycleCallback("socketinfo", $scope.onSocketInfo);
        IoTFactory.registerLifecycleCallback("dataupdate", $scope.onDataUpdate);

        IoTFactory.connectToDevice($routeParams.client_id, function(err, isConnected)
        {
            if (err)
            {
                IoTFactory.callLifecycleCallback("disconnect", true);
                return;
            }
            else
            {
                $scope.getCount();
                connectCallback();
            }
        });

        console.log("connection attempt");
    };

    $scope.domReady = function()
    {
        angular.element(document).ready(function ()
        {
            Styles.init();
            Styles.changePage();
        });
    };
});