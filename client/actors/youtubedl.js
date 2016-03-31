"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var spawn = require('child_process').spawn;
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var actormanagement = require('../actormanagement');
var socketmanager = require('../socketmanager');

// ######################################################

class youtubedl extends baseActor
{
    constructor(options)
    {
        super("youtubedl", options);
    }

    exposed()
    {
        var that = this;

        return {
            download2mp3: {
                method: that.download2mp3.bind(this),
                params: [{
                    name: "text",
                    isOptional: false,
                    dataType: "string",
                    notes: "youtube url that should be downloaded"
                }]
            }
        };
    }

    dependenciesFulfilled()
    {
        if (!actormanagement.has("music"))
            return "actor music is required";

        return true;
    }

    receiveLine(str)
    {
        return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
    }

    endsWith(str, suffix)
    {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    //from http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
    idExtractor(url)
    {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = url.match(regExp);
        return (match&&match[7].length==11)? match[7] : false;
    }

    download2mp3(ytID, cb)
    {
        var that = this;

        var onout = function(text)
        {
            socketmanager.socket.emit("client:youtube-download", {
                output: text
            });
        };

        var ondone = function(err, fileName)
        {
            var resp = { success: true };

            if (fileName && !err) {
                resp.file = fileName;
            } else {
                resp.success = false;
            }

            socketmanager.socket.emit("client:youtube-download", resp);

            return cb(err, fileName);
        };

        //accept both youtube ids and full urls.
        //if we receive a full url, extract to see if things are fine
        if (that.idExtractor(ytID))
        {
            ytID = that.idExtractor(ytID);
        }

        if (!ytID) return ondone("Invalid youtube ID");

        var url = 'https://www.youtube.com/watch?v=' + ytID;

        // ----------------------------------------------

        var search = function()
        {
            onout("Output: Found youtube id: " + ytID);

            glob(config.mediaBasePath + "/*-" + ytID + ".mp3", {}, function(err, files)
            {
                if (err)
                {
                    onout("Error: " + err);
                }
                else if (files.length === 0)
                {
                    onout("Output: Video not found on disk, downloading");
                    download();
                }
                else
                {
                    var file = files[0];
                    onout("Output: Found file " + file);
                    ondone(null, path.basename(file));
                }
            });
        };

        // ----------------------------------------------

        var download = function()
        {
            var dest = config.mediaBasePath + '/%(title)s-%(id)s.%(ext)s';
            var extractedFilename = null;
            var process = spawn("youtube-dl", ["-o", dest, "--extract-audio", "--audio-format", "mp3", url]);

            process.stdout.setEncoding('utf8');

            process.stderr.on('data', function (data)
            {
                onout("ERROR: " + receiveLine(data));
            });

            process.stdout.on('data', function (data)
            {
                data = that.receiveLine(data);

                var fileCheck = data.split("/");
                fileCheck = fileCheck[fileCheck.length - 1];

                if (that.endsWith(fileCheck, ".mp3"))
                {
                    extractedFilename = fileCheck;
                }

                onout("OUTPUT: " + data);
            });

            process.on("close", function(retCode)
            {
                if (extractedFilename && fs.existsSync(config.mediaBasePath + "/" + extractedFilename))
                {
                    //remove braces from file name, otherwise the clip cannot be played from ifttt parser
                    var withoutBraces = extractedFilename.replace(/[\(\)]/g, "");

                    if (withoutBraces !== extractedFilename)
                    {
                        that.logger.info("filename contains braces - renaming to " + withoutBraces);
                        fs.renameSync(config.mediaBasePath + "/" + extractedFilename, config.mediaBasePath + "/" + withoutBraces);
                    }

                    ondone(null, withoutBraces);
                }
                else
                {
                    ondone(null, extractedFilename);
                }
            });
        };

        // ----------------------------------------------

        search();
    }
}

module.exports = youtubedl;