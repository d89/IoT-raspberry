IoT.factory('PushFactory', function (constant)
{
    var PushFactory = {};

    //------------------------------------------------------------------

    PushFactory.time = function ()
    {
        return new Date().toString().split(" ")[4];
    };

    PushFactory.isRegistered = function (cb)
    {
        if (!('serviceWorker' in navigator))
        {
            return cb({
                shouldRegister: false,
                message: "not capable"
            });
        }

        // Check if push messaging is supported
        if (!('PushManager' in window))
        {
            return cb({
                shouldRegister: false,
                message: "no push support"
            });
        }

        if (!('showNotification' in ServiceWorkerRegistration.prototype))
        {
            return cb({
                shouldRegister: false,
                message: "no notification support"
            });
        }

        if (Notification.permission === 'denied')
        {
            return cb({
                shouldRegister: true,
                message: "no notification permission"
            });
        }

        if (!navigator.serviceWorker.controller)
        {
            return cb({
                shouldRegister: true,
                message: "not installed"
            });
        }

        navigator.serviceWorker.ready.then(function (swready)
        {
            var activated = swready.active.state === "activated";

            if (!activated)
            {
                throw new Error("not activated");
            }

            return navigator.permissions.query({name: 'push', userVisibleOnly: true}).then(function (perm)
            {
                var granted = perm.state === "granted";

                if (!granted)
                {
                    throw new Error("not granted");
                }

                return swready.pushManager.getSubscription();
            }).then(function (subscription)
            {
                if (!subscription)
                {
                    throw new Error("not subscribed");
                }

                return cb(null, true);
            }).catch(function (err)
            {
                return cb({
                    message: err,
                    shouldRegister: true
                });
            });
        }).catch(function (err)
        {
            return cb({
                message: err,
                shouldRegister: true
            });
        });
    };

    //------------------------------------------------------------------

    PushFactory.postMessage = function (clientName)
    {
        PushFactory.isRegistered(function (err, res)
        {
            if (err && err.shouldRegister)
            {
                //console.info(PushFactory.time(), "INIT SERVICE WORKER problem", err);

                PushFactory.registerPush(function (err, res)
                {
                    if (res === true)
                    {
                        PushFactory.postMessage(clientName);
                    }
                });
            }
            else //service worker is capable and ready
            {
                var msg = {
                    clientName: clientName,
                    password: constant.get("password")
                };

                navigator.serviceWorker.controller.postMessage(msg);
                //console.log(PushFactory.time(), "INIT SERVICE WORKER posted message to service worker!");
            }
        });
    };

    //------------------------------------------------------------------

    PushFactory.registerPush = function (cb)
    {
        //console.log(PushFactory.time(), "INIT SERVICE WORKER");

        const WORKER_FILE = '/assets/serviceworker/worker.js';
        const WORKER_SCOPE = {scope: './'};

        navigator.serviceWorker.register(WORKER_FILE, WORKER_SCOPE).then(function (registration)
        {
            if (registration.installing)
            {
                //console.log(PushFactory.time(), "INIT SERVICE WORKER  Service worker installing");
            }

            if (registration.waiting)
            {
                //console.log(PushFactory.time(), "INIT SERVICE WORKER  Service worker installed");
            }

            if (registration.active)
            {
                //console.log(PushFactory.time(), "INIT SERVICE WORKER  Service worker active");
            }

            return navigator.serviceWorker.ready;
        }).then(function (swready)
        {
            swready.pushManager.getSubscription().then(function (subscription)
            {
                if (subscription)
                {
                    //console.log(PushFactory.time(), "INIT SERVICE WORKER subscription done", subscription);
                    cb(null, true);
                }
                else
                {
                    return swready.pushManager.subscribe
                    ({
                        userVisibleOnly: true
                    });
                }
            }).then(function (sub)
            {
                //console.log(PushFactory.time(), "INIT SERVICE WORKER subscription done!");
                cb(null, true);
            }).catch(function (error)
            {
                //console.error(PushFactory.time(), "INIT SERVICE WORKER ACTIVATION", error);
                cb(error);
            });
        }).catch(function (error)
        {
            //console.error(PushFactory.time(), "INIT SERVICE WORKER REGISTRATION", error);
            cb(error);
        });
    };

    //------------------------------------------------------------------

    return PushFactory;
});