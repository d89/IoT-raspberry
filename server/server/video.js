var fs = require("fs");
var glob = require("glob");
var config = require("./config");
var logger = require("./logger");
var spawn = require('child_process').spawn;
const MAX_KEEP_FILES = 5;

exports.convertVideo = function(inputFile, targetName, cb)
{
    exports.deleteOldFiles();

    var finalVideoName = config.mediaBasePath + "/" + targetName;
    logger.info("received file upload at " + inputFile + " and converting to " + finalVideoName);

    if (!fs.existsSync(inputFile))
    {
        return cb("error receiveing video");
    }

    //extension .h264 needed for MP4Box to know the format
    var originalVideoName = inputFile + ".h264";
    fs.renameSync(inputFile, originalVideoName);

    //original file could not be moved?
    if (!fs.existsSync(originalVideoName))
    {
        return cb("could not move file");
    }

    //.mp4 extension needed for the html5 player
    finalVideoName = finalVideoName + ".mp4";
    var conversion = spawn("MP4Box", ["-add", originalVideoName, finalVideoName]);

    conversion.on("close", function(retCode)
    {
        logger.info("converted video with code " + retCode, "removing original " + originalVideoName);
        fs.unlinkSync(originalVideoName);

        var msg = "problem converting video";

        if (retCode !== 0 || !fs.existsSync(finalVideoName))
        {
            return cb(msg);
        }

        return cb(null, "successfully processed video");
    });
};

exports.deleteOldFiles = function()
{
    glob(config.mediaBasePath + "/video-*.mp4", {}, function(err, files)
    {
        if (err)
        {
            return logger.error("error grepping: " + err);
        }

        var sortedFiles = files.sort(function(a, b)
        {
            return fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime();
        });

        var filesToDelete = sortedFiles.length - MAX_KEEP_FILES + 1;

        if (filesToDelete > 0)
        {
            for (var i = 0; i < filesToDelete; i++)
            {
                fs.unlink(sortedFiles[i], function(err)
                {
                    if (err)
                    {
                        logger.error("could not delete file " + sortedFiles[i] + " - " + err);
                    }
                });
            }
        }
    });
};