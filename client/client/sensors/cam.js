var fs = require('fs');
var spawn = require('child_process').spawn;
var logger = require('../logger');

var Cam = {
    streamInterval: null,
    streamProcess: null,
    streamRunning: false,
    streamImage: "/var/www/IoT-raspberry/stream.jpg",
    socket: null,

    startStreaming: function(s) {
        logger.info('Starting stream.');
        Cam.socket = s;
        Cam.streamRunning = true;
        Cam.streamInterval = setInterval(Cam.takeImage, 2000);
    },

    stopStreaming: function() {
        logger.info('Stopping stream.');
        Cam.streamRunning = false;
        if (Cam.streamProcess) {
            Cam.streamProcess.kill();
        }
        clearInterval(Cam.streamInterval);
        Cam.socket = null;
    },

    takeImage: function() {
        //logger.info('taking image');
        var args = [
            '-w', 640,   // width
            '-h', 480,  // height
            '-t', 1,  // how long should taking the picture take?
            '-o', Cam.streamImage   // path + name
        ];
        Cam.streamProcess = spawn('raspistill', args);
        Cam.streamProcess.on('exit', Cam.sendImage);
    },

    sendImage: function()
    {
        if (!Cam.streamRunning)
        {
            logger.info('sending no image, stream is stopped');
            return;
        }

        logger.info('sending image @ ' + (new Date), Cam.streamImage);

        fs.readFile(Cam.streamImage, function(err, buffer)
        {
            Cam.socket.emit('client:live-stream', {
                date: new Date(),
                image: buffer.toString('base64')
            }, function resp(response)
            {
                if (!response || !response.received)
                {
                    logger.error("no cam stream response from server - stopping streaming");
                    Cam.stopStreaming();
                }
                else
                {
                    logger.info("cam stream confirmed by server: ", response);
                }
            });
        });
    }
};

module.exports = Cam;