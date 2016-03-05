var fs = require("fs");
var glob = require("glob");
var config = require("./config");
var logger = require("./logger");
var spawn = require('child_process').spawn;
const MAX_KEEP_FILES = 5;

exports.moveVideo = function(inputFile, targetName, cb)
{
    exports.deleteOldFiles();

    var finalVideoName = config.mediaBasePath + "/" + targetName + ".mp4";
    logger.info("received file upload at " + inputFile + " and moving to " + finalVideoName);

    if (!fs.existsSync(inputFile))
    {
        return cb("error receiveing video");
    }

    fs.rename(inputFile, finalVideoName, function(err)
    {
        if (err)
            return cb(null, "could not move video");

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