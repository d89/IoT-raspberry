'use strict';

console.log('SERVICE WORKER Started!', self);

var ENDPOINT = "https://d1303.de:3000/push";
var URL_TO_OPEN = "https://d13033.de:3000";
var PUSH_TAG = 'IoT-push';

self.addEventListener('install', function(event)
{
    self.skipWaiting();
    console.log('SERVICE WORKER Installed!', event);
});

self.addEventListener('activate', function(event)
{
    console.log('SERVICE WORKER Activated!', event);
});

self.addEventListener('push', function(event)
{
    console.log('SERVICE WORKER Received Push Message!', event, "data", event.data);

    // Since this is no payload data with the first version
    // of Push notifications, here we'll grab some data from
    // an API and use it to populate a notification
    event.waitUntil
    (
        fetch(ENDPOINT, {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: 'client=Davids IoT-Raspberry' //TODO
        }).then(function(response)
        {
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
            });
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
                return clients.openWindow('https://d1303.de:3000');
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
