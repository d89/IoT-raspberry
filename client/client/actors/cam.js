var fs = require('fs');
var path = require('path');
var async = require('async');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var moment = require('moment');
var request = require('request');
var logger = require('../logger');
var config = require('../config');
var recorder = require('./recorder');
var receiveLine = function(str) {
    return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
};

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

        var callbacks = [];

        //-----------------------------------------------------------------------------------

        callbacks.push(function(recordingDone)
        {
            recorder.record(path.basename(videoPath + ".wav"), (duration / 1000), "/tmp", function(err, fileName)
            {
                if (err)
                    return recordingDone(err);

                return recordingDone(null, fileName);
            });
        });

        //-----------------------------------------------------------------------------------
        var raspivid = spawn("raspivid", ["-t", duration, "-o", videoPath, "-w", 640, "-h", 480]);

        callbacks.push(function(videoDone)
        {
            raspivid.on("close", function()
            {
                Cam.cameraBusyRecording = false;

                if (!fs.existsSync(videoPath))
                {
                    var msg = "video " + videoPath + " did not exist";
                    logger.error(msg);
                    return videoDone(msg);
                }

                logger.info("wrote video to " + videoPath);

                return videoDone(null, videoPath);
            });
        });

        //-----------------------------------------------------------------------------------

        async.parallel(callbacks, function(err, data)
        {
            //only one error callback is being executed.
            if (err)
            {
                return cb(err);
            }

            Cam.convert(data[0], data[1], cb);
        });

        //-----------------------------------------------------------------------------------
    },

    convert: function(audioFile, videoFile, cb)
    {
        logger.info("merging audio " + audioFile + " with video " + videoFile);

        if (!fs.existsSync(audioFile) || !fs.existsSync(videoFile))
        {
            return cb("either video or audio file did not exist");
        }

        var date = moment().format("YYYYMMDD-HHmmss");
        var finalFileName = "/tmp/video-" + date + ".mp4";

        //http://stackoverflow.com/questions/11779490/ffmpeg-how-to-add-new-audio-not-mixing-in-video
        //https://gist.github.com/jamiew/5110703
        var converter = spawn("MP4Box", ["-add", videoFile, "-add", audioFile, finalFileName]);

        converter.stdout.on("data", function(data)
        {
            logger.info("conversion output: ", receiveLine(data.toString()));
        });

        converter.stderr.on("data", function(data)
        {
            //likes putting out stuff on stderr that is not an error
            logger.info("conversion data: ", receiveLine(data.toString()));
        });

        converter.on("close", function(exitCode)
        {
            logger.info("converting " + videoFile + " ended with " + exitCode);

            fs.unlink(audioFile, function(err) {
                err && logger.error("audio file " + audioFile + " could not be deleted: " + err);
            });

            fs.unlink(videoFile, function(err) {
                err && logger.error("video file " + videoFile + " could not be deleted: " + err);
            });

            if (exitCode === 0 && fs.existsSync(finalFileName))
            {
                Cam.uploadVideo(finalFileName, cb);
            }
            else
            {
                cb("could not convert file");
            }
        });
    },

    uploadVideo: function(videoPath, cb)
    {
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
    },

    sendImage: function()
    {
        if (!Cam.cameraBusyStreaming || !fs.existsSync(Cam.streamImage))
        {
            logger.info('sending no image, stream is stopped');
            return;
        }

        var fileModDate = fs.statSync(Cam.streamImage).mtime;

        logger.info('sending image @ ' + fileModDate, Cam.streamImage);

        fs.readFile(Cam.streamImage, function(err, buffer)
        {
            if (!buffer)
            {
                logger.error("invalid cam response");
                return Cam.stopStreaming();
            }

            Cam.socket.emit('client:live-stream', {
                now: (new Date).getTime(),
                date: fileModDate.getTime(),
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

/*
Cam.record(5, function(err, data)
{
    if (err)
        logger.error("-> final err", err);
    else
        logger.info("-> final resp", data);
});
*/

module.exports = Cam;