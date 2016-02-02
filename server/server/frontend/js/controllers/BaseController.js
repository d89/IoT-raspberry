IoT.controller('IoTBaseCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory, PushFactory)
{
    $scope.resumeCheck = function()
    {
        var lastTime = (new Date()).getTime();

        setInterval(function()
        {
            var currentTime = (new Date()).getTime();
            if (currentTime > (lastTime + 2000 * 2)) {  // ignore small delays
                // Probably just woke up!
                console.log("########################## " + new Date() + " Was dead, alive now!");

                //immediately reload before the error becomes visible
                if (!$scope.errorVisible())
                {
                    location.reload();
                }
            }
            else
            {
                console.log("########################## " + new Date() + " Refresh");
            }

            lastTime = currentTime;
        }, 2000);
    };

    $scope.errorMessageQuery = function(err)
    {
        //error message already shown
        if ($scope.errorVisible())
        {
            return;
        }

        var errMessage = "Unknown Error";

        if (err === "disconnect-server")
        {
            errMessage = "Disconnected - the client '" + $routeParams.client_id + "' is not known.";
        }
        else if (err === "disconnect-client")
        {
            errMessage = "Disconnected - the client '" + $routeParams.client_id + "' just went away.";
        }

        $scope.errMessage = errMessage;
        $scope.$apply();

        jQuery('#modal-error').modal('toggle');
    };

    $scope.errorVisible = function()
    {
        return $scope.errMessage || jQuery('#modal-error').is(":visible");
    };

    $scope.refresh = function()
    {
        location.reload();
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
        $scope.errorMessageQuery(err);
    };

    $scope.onSocketInfo = function(err, clientName, connectedAt)
    {
        if (err)
        {
            console.log("DISCONNECT on socket info client disconnect!");
            SocketFactory.callLifecycleCallback("disconnect", true);
            return;
        }

        //we know that we have a working connection here
        PushFactory.registerPush(clientName);

        $scope.clientName = clientName;
        $scope.connectedAt = connectedAt;
        $scope.$apply();
    };

    $scope.onDataUpdate = function(message, messageCount)
    {
        $scope.clientMessages = messageCount;
        $scope.$apply();
    };

    //-----------------------------------------------------

    $scope.getCount = function()
    {
        SocketFactory.getCount(function(err, count)
        {
            if (err)
            {
                console.log("DISCONNECT get count server disconnect!");
                SocketFactory.callLifecycleCallback("disconnect", false);
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

            SocketFactory.clientMessages = 0;
        }

        if (SocketFactory.isConnected())
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

        SocketFactory.resetLifecycleCallbacks();
        SocketFactory.registerLifecycleCallback("disconnect", $scope.onDisconnect);
        SocketFactory.registerLifecycleCallback("socketinfo", $scope.onSocketInfo);
        SocketFactory.registerLifecycleCallback("dataupdate", $scope.onDataUpdate);

        SocketFactory.connectToDevice($routeParams.client_id, function(err, isConnected)
        {
            if (err)
            {
                console.log("DISCONNECT (re)connection disconnect!");
                SocketFactory.callLifecycleCallback("disconnect", true);
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
            $scope.resumeCheck();
            Styles.changePage();
        });
    };
});