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

    $scope.loadDashboard = function(id)
    {
        $routeParams.client_id = id;

        $scope.connect(true, function()
        {
            $rootScope.$apply(function()
            {
                $location.path('/dashboard/' + id);
            });
        });
    };

    $scope.registerPush = function()
    {
        if (!('serviceWorker' in navigator))
        {
            console.warn("INIT SERVICE WORKER No service worker");
            return;
        }

        navigator.serviceWorker.register('/assets/serviceworker/worker.js', { scope: './' }).then(function(reg)
        {
            if(reg.installing) {
                console.log('INIT SERVICE WORKER  Service worker installing');
            } else if(reg.waiting) {
                console.log('INIT SERVICE WORKER  Service worker installed');
            } else if(reg.active) {
                console.log('INIT SERVICE WORKER  Service worker active');
            }

            /*
            Notification.requestPermission(function(result) {
                if (result === 'granted') {
                    navigator.serviceWorker.ready.then(function(registration) {
                        registration.showNotification('Notification with ServiceWorker');
                    });
                }
            });
            */

            navigator.serviceWorker.ready.then(function(reg) {

                // Check if push messaging is supported
                if (!('PushManager' in window)) {
                    console.warn('Push messaging is not supported.');
                    return;
                }

                if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
                    console.warn('Notifications are not supported.');
                    return;
                }

                if (Notification.permission === 'denied') {
                    console.warn('Notifications are denied.');
                    return;
                }

                console.log("INIT SERVICE WORKER ready");

                navigator.permissions.query({name: 'push', userVisibleOnly: true}).then(function(perm)
                {
                    console.log("INIT SERVICE WORKER permission state", perm);

                    reg.pushManager.getSubscription().then(function (subscription)
                    {
                        if (subscription) {
                            console.log("INIT SERVICE WORKER already subscribed to push");
                            return;
                        }

                        reg.pushManager.subscribe
                        ({
                            userVisibleOnly: true
                        }).
                        then(function (sub) {
                            var tkn = sub.endpoint.split("send/")[1];

                            $.post("/pushtoken", {
                                token: tkn
                            }).then(function (respText, state, xhr) {
                                if (state === "success") {
                                    console.log('INIT SERVICE WORKER registered for push', respText);
                                }
                                else {
                                    console.error("INIT SERVICE WORKER error registering for push", respText, state, xhr);
                                }
                            });
                        }).catch(function(error)
                        {
                            console.log('INIT SERVICE WORKER service worker not ready', error);
                        });
                    })
                }).catch(function(error)
                {
                    console.log('INIT SERVICE WORKER permission error', error);
                });
            }).catch(function(error)
            {
                console.log('INIT SERVICE WORKER service worker not ready', error);
            });
        }).catch(function(error)
        {
            console.log('INIT SERVICE WORKER service worker error', error);
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
        $scope.registerPush();
    };

    //-----------------------------------------------------

    $scope.init();
});