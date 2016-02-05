'use strict';

importScripts('https://cdnjs.cloudflare.com/ajax/libs/localforage/1.3.3/localforage.min.js');

console.log('SERVICE WORKER Started!', self);

var ENDPOINT_FETCH = "/push";
var ENDPOINT_REGISTER = "/pushtoken";
var URL_TO_OPEN = "/";
var PUSH_TAG = 'IoT-push';

self.addEventListener('install', function(event)
{
    //don't wait for other tabs to refresh to the newest sw version
    //http://stackoverflow.com/questions/28069249/how-to-stop-older-service-workers
    event.waitUntil(self.skipWaiting());
    console.log('SERVICE WORKER Installed!', event);
});

self.addEventListener('activate', function(event)
{
    console.log('SERVICE WORKER Activated!', event);
    //take over immediately - new service worker activated right away
    //http://stackoverflow.com/questions/28069249/how-to-stop-older-service-workers
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', function (evt)
{
    console.log('SERVICE WORKER client name received', evt.data);

    //saving client name
    if (evt.data.clientName)
    {
        var clientName = evt.data.clientName;

        localforage.setItem('clientName', clientName).then(function(resp) {
            console.log("SERVICE WORKER SET clientName", resp);

            return self.registration.pushManager.getSubscription();

        }).then(function (subscription) {
            if (!subscription)
                throw new Error("SERVICE WORKER no subscription present!");

            var tkn = subscription.endpoint.split("send/")[1];

            return fetch(ENDPOINT_REGISTER, {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body: 'tkn=' + tkn + "&client=" + clientName
            });
        }).then(function(response)
        {
            console.log("SERVICE WORKER saving token success", response);
        }).catch(function(err)
        {
            console.error('SERVICE WORKER saving token error', err);
        });
    }
});

self.addEventListener('push', function(event)
{
    // Since this is no payload data with the first version
    // of Push notifications, here we'll grab some data from
    // an API and use it to populate a notification
    event.waitUntil
    (
        localforage.getItem('clientName').then(function(clientName)
        {
            console.log("SERVICE WORKER GOT clientName", clientName);

            if (!clientName)
                throw new Error("unknown identifier from database");

            console.log("SERVICE WORKER got client name " + clientName);

            return fetch(ENDPOINT_FETCH, {
                method: 'post',
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body: 'client=' + clientName
            });
        })
        .then(function(response)
        {
            console.log("SERVICE WORKER fetched push notification");

            if (response.status !== 200) {
                // Throw an error so the promise is rejected and catch() is executed
                throw new Error('SERVICE WORKER Invalid status code from Request: ' + response.status);
            }

            // Examine the text in the response
            return response.json();
        })
        .then(function(data)
        {
            console.log('SERVICE WORKER Request data: ', data);

            var notificationFilter = {
                tag: PUSH_TAG
            };

            var notificationData = {
                url: URL_TO_OPEN
            };

            var message = data.message;

            // Check if a notification is already displayed
            return self.registration.getNotifications(notificationFilter).then(function(notifications)
            {
                console.log("old notifications", notifications);

                if (notifications && notifications.length > 0)
                {
                    // Start with one to account for the new notification
                    // we are adding
                    var notificationCount = 1;

                    for (var i = 0; i < notifications.length; i++)
                    {
                        var existingNotification = notifications[i];
                        if (existingNotification.data && existingNotification.data.notificationCount)
                        {
                            notificationCount += existingNotification.data.notificationCount;
                        }
                        else
                        {
                            notificationCount++;
                        }

                        existingNotification.close();
                    }

                    message = 'You have ' + notificationCount + ' IoT updates.';
                    notificationData.notificationCount = notificationCount;

                    return showNotification(message, notificationData);
                }
                else
                {
                    return showNotification(message, notificationData);
                }
            })
        })
        .catch(function(err)
        {
            console.error('SERVICE WORKER A Problem occured with handling the push msg', err);

            var message = 'We were unable to get the information for this push message';

            return showNotification(message);
        })
    );
});

self.addEventListener('notificationclick', function(event)
{
    console.log('SERVICE WORKER On notification click: ', event.notification.tag);
    // Android doesn't close the notification when you click on it
    // See: http://crbug.com/463146
    event.notification.close();

    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(
        clients.matchAll({
            type: "window"
        })
        .then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                console.log("push client", client);
                if (client.url && 'focus' in client)
                    return client.focus();
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

function showNotification(text, data)
{
    console.log('SERVICE WORKER showNotification');

    var title = 'IoT-Portal';
    self.registration.showNotification(title,
    {
        body: text,
        icon: '/assets/img/favicons/touchicon.png',
        tag: PUSH_TAG,
        data: data,
        vibrate: [300, 100, 400]
    })
}

console.log('SERVICE WORKER Bound all', self);
