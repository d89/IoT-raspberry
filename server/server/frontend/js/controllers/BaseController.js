IoT.controller('IoTBaseCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory, PushFactory)
{
    $scope.errorMessageQuery = function(err, options)
    {
        //error message already shown
        if ($scope.errorVisible())
        {
            return;
        }

        options = options || {};

        var errMessage = "Unknown Error";

        if (err === "disconnect-server")
        {
            errMessage = "Disconnected - the client '" + $routeParams.client_id + "' is not known.";
        }
        else if (err === "disconnect-client")
        {
            errMessage = "Disconnected - the client '" + $routeParams.client_id + "' just went away.";
        }
        else if (err === "inactive")
        {
            errMessage = "Reload necessary, please wait.";
        }
        else if (err === "wrongpassword")
        {
            errMessage = "Wrong password, Performing logout.";
        }
        else if (err === "loggedout")
        {
            errMessage = "Logged out.";
        }

        if (options.hideButtons)
        {
            $(".modal-footer").hide();
        }
        else
        {
            $(".modal-footer").show();
        }

        $scope.errMessage = errMessage;

        if (!$scope.$$phase)
            $scope.$apply();

        jQuery('#modal-error').modal('toggle');

        if (options.reload)
        {
            setTimeout(function()
            {
                location.reload();
            }, options.reload);
        }
    };

    $scope.errorVisible = function()
    {
        return $scope.errMessage || jQuery('#modal-error').is(":visible");
    };

    $scope.refresh = function()
    {
        $(".modal-footer").hide();
        $("#error-message").text("Reloading ...");

        location.reload();
    };

    $scope.startPageAfterError = function()
    {
        $(".modal-footer").hide();
        $("#error-message").text("Forwarding ...");
        $location.path('/index');

        $timeout(function()
        {
            location.reload();
        }, 500);
    };

    //-----------------------------------------------------

    $scope.onDisconnect = function(isClientDisconnect)
    {
        console.log("handeling disconnection");
        var err = isClientDisconnect ? "disconnect-client" : "disconnect-server";
        $scope.errorMessageQuery(err);
    };

    $scope.onSocketInfo = function(err, clientName, connectedAt, capabilities)
    {
        if (err)
        {
            console.log("DISCONNECT on socket info client disconnect!");
            SocketFactory.callLifecycleCallback("disconnect", true);
            return;
        }

        //we know that we have a working connection here
        if (navigator.serviceWorker.controller)
        {
            var msg = {'clientName': clientName};
            navigator.serviceWorker.controller.postMessage(msg);
            console.log("posted message to service worker: ", msg);
        }
        else
        {
            console.error("no service worker registered yet!");
        }

        console.log("GOT the capabilities of the client", capabilities);

        var chartTypes = [];
        var trans = constant.get("chartTypeTranslations");

        capabilities.forEach(function(c)
        {
            chartTypes.push({
                id: c,
                label: trans[c] || c
            });
        });

        $scope.chartTypes = chartTypes;
        $scope.clientName = clientName;
        $scope.connectedAt = connectedAt;
        $scope.$apply();
    };

    $scope.onWrongPassword = function()
    {
        console.log("on wrong password");
        $scope.logout("wrongpassword");
    };

    $scope.logout = function(messageKey)
    {
        messageKey = messageKey || "loggedout";

        var id = $routeParams.client_id;
        console.log("logout for " + id);
        localStorage.removeItem(id);
        $location.path('/index');

        $scope.errorMessageQuery(messageKey, {
            hideButtons: true,
            reload: 1000
        });
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
                console.log("DISCONNECT get count server disconnect!", err);
                SocketFactory.callLifecycleCallback(err, false);
                return;
            }

            $scope.count = count;
            $scope.$apply();
        });
    };

    $scope.connect = function(reconnect, connectCallback)
    {
        if (reconnect)
        {
            console.log("RESETTING client message count");

            SocketFactory.clientMessages = 0;
        }

        //init password storage
        constant.set("password", localStorage.getItem($routeParams.client_id));

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
        SocketFactory.registerLifecycleCallback("wrongpassword", $scope.onWrongPassword);
        SocketFactory.registerLifecycleCallback("dataupdate", $scope.onDataUpdate);

        //reload, when the page regains visibility state and we are on a mobile device
        //usually, the mobile browser kills the socket connection when it is in the background
        //and we don't regain access after we are back
        Styles.registerVisibilityChangeHandler(function(becameVisible, isMobile)
        {
            if (!becameVisible && isMobile)
            {
                $scope.errorMessageQuery("inactive", {
                     hideButtons: true
                });
            }

            if (becameVisible && isMobile)
            {
                $timeout(function()
                {
                    location.reload();
                }, 1000);
            }
        });

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