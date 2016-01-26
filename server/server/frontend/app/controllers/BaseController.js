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
        if (!err)
        {
            $scope.clientName = clientName;
            $scope.connectedAt = connectedAt;
        }
        else
        {
            //TODO
        }
    };

    $scope.onDataUpdate = function(message, messageCount)
    {
        //console.log("new message", message);
        $scope.clientMessages = messageCount;

        if ($scope.dataUpdateCallback) //TODO
        {
            $scope.dataUpdateCallback(message, messageCount);
        }

        $scope.$apply();
    };

    //-----------------------------------------------------

    $scope.registerDataUpdateHandlerSource = function(cb)
    {
        $scope.dataUpdateCallback = cb;
    };

    $scope.getCount = function()
    {
        IoTFactory.getCount(function(count)
        {
            $scope.count = count;
            $scope.$apply();
        });
    };

    $scope.connect = function(reconnect, onConnected)
    {
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

                if (onConnected)
                    return onConnected();

                return;
            }
        }

        //TODO refactor me
        IoTFactory.registerDisconnectHandler($scope.onDisconnect);
        IoTFactory.registerSocketInfoHandler($scope.onSocketInfo);
        IoTFactory.registerDataUpdateHandler($scope.onDataUpdate);

        IoTFactory.connectToDevice($routeParams.client_id, onConnected);

        $scope.getCount();
    };

    $scope.domReady = function()
    {
        angular.element(document).ready(function ()
        {
            Styles.init();
        });
    };
});