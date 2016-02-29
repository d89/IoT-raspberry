var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var moment = require('moment');
var request = require('request');
var logger = require('../logger');
var config = require('../config');

var Cam = {
    streamInterval: null,
    streamProcess: null,
    cameraBusyStreaming: false,
    cameraBusyRecording: false,
    streamImage: "/tmp/stream.jpg",
    socket: null,

    exposed: function()
    {
        return {
            record: {
                method: Cam.record,
                params: [{
                    name: "duration",
                    isOptional: true,
                    dataType: "integer",
                    notes: "Number of seconds the camera shall record video."
                }]
            }
        };
    },

    startStreaming: function(s) {
        logger.info('Starting stream.');
        Cam.socket = s;
        Cam.cameraBusyStreaming = true;
        Cam.streamInterval = setInterval(Cam.takeImage, 2000);
    },

    stopStreaming: function() {
        logger.info('Stopping stream.');
        Cam.cameraBusyStreaming = false;
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

    record: function(duration, cb)
    {
        cb = cb || function() {};

        if (Cam.cameraBusyRecording || Cam.cameraBusyStreaming)
        {
            logger.error("camera is busy, can not start video");
            return cb("camera is busy");
        }

        Cam.cameraBusyRecording = true;

        if (!duration || isNaN(duration))
        {
            duration = 5;
        }

        duration *= 1000;

        logger.info("starting to record for " + duration + "ms");
        var date = moment().format("YYYYMMDD-HHmmss");
        var videoPath = "/tmp/video-" + date + ".h264";
        logger.info("... to file", videoPath);

        var raspivid = spawn("raspivid", ["-t", duration, "-o", videoPath, "-w", 640, "-h", 480]);
        raspivid.on("close", function()
        {
            Cam.cameraBusyRecording = false;

            if (!fs.existsSync(videoPath))
            {
                var msg = "video " + videoPath + " did not exist";
                logger.error(msg);
                return cb(msg);
            }

            logger.info("wrote video to " + videoPath);

            //upload video
            var req = request.post(config.serverUrl + "/putvideo", function(err, resp, body)
            {
                fs.unlinkSync(videoPath);

                var msg = "Error uploading video";

                if (err || resp.statusCode != 200) {
                    err = err || body;
                    logger.error(msg, err);
                    cb(msg);
                } else {
                    msg = "Successfully uploaded video";
                    logger.info(msg + ": " + body);
                    cb(null, msg);
                }
            });

            var form = req.form();
            form.append('vid', fs.createReadStream(videoPath));
            form.append('password', crypto.createHash('sha512').update(config.password).digest('hex'));
            form.append('client', config.clientName);
        });
    },

    sendImage: function()
    {
        if (!Cam.cameraBusyStreaming)
        {
            logger.info('sending no image, stream is stopped');
            return;
        }

        logger.info('sending image @ ' + (new Date), Cam.streamImage);

        fs.readFile(Cam.streamImage, function(err, buffer)
        {
            if (!buffer)
            {
                logger.error("invalid cam response");
                return Cam.stopStreaming();
            }

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