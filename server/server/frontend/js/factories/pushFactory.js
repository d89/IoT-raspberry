IoT.factory('PushFactory', function(constant)
{
    var PushFactory = {};

    PushFactory.registerPush = function(clientName)
    {
        console.log("INIT SERVICE WORKER for push client name " + clientName);

        if (!('serviceWorker' in navigator))
        {
            console.warn("INIT SERVICE WORKER No service worker");
            return;
        }

        navigator.serviceWorker.register('/assets/serviceworker/worker.js', { scope: './' }).then(function(reg)
        {
            if (reg.installing) {
                console.log('INIT SERVICE WORKER  Service worker installing');
            } else if (reg.waiting) {
                console.log('INIT SERVICE WORKER  Service worker installed');
            } else if (reg.active) {
                console.log('INIT SERVICE WORKER  Service worker active');
            }
        }).then(function(reg)
        {
            navigator.serviceWorker.ready.then(function(reg)
            {
                // Check if push messaging is supported
                if (!('PushManager' in window)) {
                    throw new Error('INIT SERVICE WORKER Push messaging is not supported.');
                }

                if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
                    throw new Error('INIT SERVICE WORKER Notifications are not supported.');
                }

                if (Notification.permission === 'denied') {
                    throw new Error('INIT SERVICE WORKER Notifications are denied.');
                }

                console.log("INIT SERVICE WORKER ready");

                navigator.permissions.query({name: 'push', userVisibleOnly: true}).then(function(perm)
                {
                    console.log("INIT SERVICE WORKER permission state", perm);

                    reg.pushManager.getSubscription().then(function(subscription)
                    {
                        if (subscription) {
                            throw new Error("INIT SERVICE WORKER already subscribed to push");
                        }

                        reg.pushManager.subscribe
                        ({
                            userVisibleOnly: true
                        }).
                        then(function (sub)
                        {
                            var tkn = sub.endpoint.split("send/")[1];

                            $.post("/pushtoken", {
                                token: tkn,
                                client: clientName
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
                    }).catch(function(error)
                    {
                        console.log('INIT SERVICE WORKER registration', error);
                    });
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

    return PushFactory;
});