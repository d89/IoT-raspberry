"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
var request = require('request');
var actormanagement = require('../actormanagement');

// ######################################################

class cam extends baseActor
{
    constructor(options)
    {
        super("cam", options);

        this.streamInterval = null;
        this.streamProcess = null;
        this.cameraBusyStreaming = false;
        this.cameraBusyRecording = false;
        this.streamImage = "/tmp/stream.jpg";
        this.socket = null;
    }

    receiveLine(str)
    {
        return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
    }

    exposed()
    {
        return {
            record: {
                method: this.record.bind(this),
                params: [{
                    name: "duration",
                    isOptional: true,
                    dataType: "integer",
                    notes: "Number of seconds the camera shall record video. Defaults to 5."
                }]
            }
        };
    }

    startStreaming(s)
    {
        var that = this;
        that.logger.info('Starting stream.');
        that.socket = s;
        that.cameraBusyStreaming = true;
        that.streamInterval = setInterval(function()
        {
            that.takeImage.apply(that);
        }, 2000);
    }

    stopStreaming()
    {
        this.logger.info('Stopping stream.');
        this.cameraBusyStreaming = false;
        if (this.streamProcess) {
            this.streamProcess.kill();
        }
        clearInterval(this.streamInterval);
        this.socket = null;
    }

    takeImage()
    {
        var that = this;

        //that.logger.info('taking image');
        var args = [
            '-w', 640,   // width
            '-h', 480,  // height
            '-t', 1,  // how long should taking the picture take?
            '-o', this.streamImage   // path + name
        ];

        that.streamProcess = spawn('raspistill', args);
        that.streamProcess.on('exit', function(exitCode)
        {
            that.sendImage();
        });
    }

    record(duration, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("actor result", err, resp);
        };

        if (that.cameraBusyRecording || that.cameraBusyStreaming)
        {
            that.logger.error("camera is busy, can not start video");
            return cb("camera is busy");
        }

        that.cameraBusyRecording = true;

        if (!duration || isNaN(duration))
        {
            duration = 5;
        }

        duration *= 1000;

        that.logger.info("starting to record for " + duration + "ms");
        var date = moment().format("YYYYMMDD-HHmmss");
        var videoPath = "/tmp/video-" + date + ".h264";
        that.logger.info("... to file", videoPath);

        var callbacks = [];

        //-----------------------------------------------------------------------------------

        if (actormanagement.has("recorder"))
        {
            callbacks.push(function(recordingDone)
            {
                actormanagement.registeredActors["recorder"].doRecord(path.basename(videoPath + ".wav"), (duration / 1000), "/tmp", function(err, fileName)
                {
                    if (err)
                        return recordingDone(err);

                    return recordingDone(null, fileName);
                });
            });
        }

        //-----------------------------------------------------------------------------------
        var raspivid = spawn("raspivid", ["-t", duration, "-o", videoPath, "-w", 640, "-h", 480]);

        callbacks.push(function(videoDone)
        {
            raspivid.on("close", function()
            {
                that.cameraBusyRecording = false;

                if (!fs.existsSync(videoPath))
                {
                    var msg = "video " + videoPath + " did not exist";
                    that.logger.error(msg);
                    return videoDone(msg);
                }

                that.logger.info("wrote video to " + videoPath);

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

            var hasAudio = data.length === 2;

            that.logger.info("has audio?", hasAudio);

            if (hasAudio)
            {
                that.convert(data[0], data[1], cb);
            }
            else
            {
                that.convert(null, data[0], cb);
            }
        });
    }

    convert(audioFile, videoFile, cb)
    {
        var that = this;

        if (audioFile)
        {
            that.logger.info("merging audio " + audioFile + " with video " + videoFile);

            if (!fs.existsSync(audioFile) || !fs.existsSync(videoFile))
            {
                return cb("either video or audio file did not exist");
            }
        }
        else
        {
            that.logger.info("converting video " + videoFile + ", no audio");

            if (!fs.existsSync(videoFile))
            {
                return cb("video file does not exist");
            }
        }

        var date = moment().format("YYYYMMDD-HHmmss");
        var finalFileName = "/tmp/video-" + date + ".mp4";

        //http://stackoverflow.com/questions/11779490/ffmpeg-how-to-add-new-audio-not-mixing-in-video
        //https://gist.github.com/jamiew/5110703
        var params = ["-add", videoFile ];

        if (audioFile)
        {
            params.push("-add");
            params.push(audioFile);
        }

        params.push(finalFileName);

        var converter = spawn("MP4Box", params);

        converter.stdout.on("data", function(data)
        {
            that.logger.info("conversion output: ", that.receiveLine(data.toString()));
        });

        converter.stderr.on("data", function(data)
        {
            //likes putting out stuff on stderr that is not an error
            that.logger.info("conversion data: ", that.receiveLine(data.toString()));
        });

        converter.on("close", function(exitCode)
        {
            that.logger.info("converting " + videoFile + " ended with " + exitCode);

            audioFile && fs.unlink(audioFile, function(err) {
                err && that.logger.error("audio file " + audioFile + " could not be deleted: " + err);
            });

            fs.unlink(videoFile, function(err) {
                err && that.logger.error("video file " + videoFile + " could not be deleted: " + err);
            });

            if (exitCode === 0 && fs.existsSync(finalFileName))
            {
                that.uploadVideo(finalFileName, cb);
            }
            else
            {
                cb("could not convert file");
            }
        });
    }

    uploadVideo(videoPath, cb)
    {
        var that = this;
        
        //upload video
        var req = request.post(config.serverUrl + "/putvideo", function(err, resp, body)
        {
            fs.unlinkSync(videoPath);

            var msg = "Error uploading video";

            if (err || resp.statusCode != 200) {
                err = err || body;
                that.logger.error(msg, err);
                cb(msg);
            } else {
                msg = path.basename(videoPath);
                that.logger.info(msg + ": " + body);
                cb(null, msg);
            }
        });

        var form = req.form();
        form.append('vid', fs.createReadStream(videoPath));
        form.append('password', crypto.createHash('sha512').update(config.password).digest('hex'));
        form.append('client', config.clientName);
    }

    sendImage()
    {
        var that = this;
        
        if (!that.cameraBusyStreaming || !fs.existsSync(that.streamImage))
        {
            that.logger.info('sending no image, stream is stopped');
            return;
        }

        var fileModDate = fs.statSync(that.streamImage).mtime;

        that.logger.info('sending image @ ' + fileModDate, that.streamImage);

        fs.readFile(that.streamImage, function(err, buffer)
        {
            if (!buffer)
            {
                that.logger.error("invalid cam response");
                return that.stopStreaming();
            }

            that.socket.emit('client:live-stream', {
                now: (new Date).getTime(),
                date: fileModDate.getTime(),
                image: buffer.toString('base64')
            }, function resp(response)
            {
                if (!response || !response.received)
                {
                    that.logger.error("no cam stream response from server - stopping streaming");
                    that.stopStreaming();
                }
                else
                {
                    that.logger.info("cam stream confirmed by server: ", response);
                }
            });
        });
    }
}

module.exports = cam;
