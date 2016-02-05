IoT.factory('PushFactory', function(constant)
{
    var PushFactory = {};

    PushFactory.registerPush = function(successfulyFinished)
    {
        console.log("INIT SERVICE WORKER");

        if (!('serviceWorker' in navigator))
        {
            console.warn("INIT SERVICE WORKER No service worker");
            return;
        }

        const WORKER_FILE = '/assets/serviceworker/worker.js';
        const WORKER_SCOPE = { scope: './'  };

        navigator.serviceWorker.register(WORKER_FILE, WORKER_SCOPE).then(function(registration)
        {
            if (registration.installing)
                console.log('INIT SERVICE WORKER  Service worker installing');

            if (registration.waiting)
                console.log('INIT SERVICE WORKER  Service worker installed');

            if (registration.active)
                console.log('INIT SERVICE WORKER  Service worker active');

            return navigator.serviceWorker.ready;
        }).then(function(swready) {
            // Check if push messaging is supported
            if (!('PushManager' in window))
                throw new Error('INIT SERVICE WORKER Push messaging is not supported.');

            if (!('showNotification' in ServiceWorkerRegistration.prototype))
                throw new Error('INIT SERVICE WORKER Notifications are not supported.');

            if (Notification.permission === 'denied')
                throw new Error('INIT SERVICE WORKER Notifications are denied.');

            console.log("INIT SERVICE WORKER ready");

            navigator.permissions.query({name: 'push', userVisibleOnly: true}).then(function (perm) {
                console.log("INIT SERVICE WORKER permission state", perm);

                return swready.pushManager.getSubscription();
            }).then(function (subscription) {
                if (subscription) {
                    if (successfulyFinished) successfregFinished();
                    console.log("INIT SERVICE WORKER subscription done", subscription);
                    throw new Error("INIT SERVICE WORKER already subscribed to push");
                }

                return swready.pushManager.subscribe
                ({
                    userVisibleOnly: true
                });
            }).then(function (sub) {
                console.log("INIT SERVICE WORKER subscription done!");
                if (successfulyFinished) successfulyFinished();
            }).catch(function (error) {
                console.log('INIT SERVICE WORKER ACTIVATION', error);
            });
        }).catch(function(error)
        {
            console.log('INIT SERVICE WORKER REGISTRATION', error);
        });
    };

    return PushFactory;
});