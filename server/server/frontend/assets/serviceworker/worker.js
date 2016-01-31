'use strict';

console.log('SERVICE WORKER Started!', self);

self.addEventListener('install', function(event) {
    self.skipWaiting();
    console.log('SERVICE WORKER Installed!', event);
});

self.addEventListener('activate', function(event) {
    console.log('SERVICE WORKER Activated!', event);
});

self.addEventListener('push', function(event) {
    console.log('SERVICE WORKER Received Push Message', event, "data", event.data);

    var title = 'IoT-Portal';
    event.waitUntil(
        self.registration.showNotification(title, {
            body: 'New event on the IoT-Portal for client "Davids IoT-Raspberry"',
            icon: '/assets/img/favicons/touchicon.png',
            tag: 'iot-push'
        }));
});

self.addEventListener('notificationclick', function(event) {
    console.log('On notification click: ', event.notification.tag);
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

console.log('SERVICE WORKER Bound all', self);
