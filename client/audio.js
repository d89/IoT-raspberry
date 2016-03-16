var logger = require('./logger');
var config = require('./config');
var spawn = require('child_process').spawn;
var glob = require('glob');
var path = require('path');
var fs = require('fs');

exports.delete = function(fileName, cb)
{
    fileName = fileName.replace("..", "");
    fileName = config.mediaBasePath + "/" + fileName;

    if (!fs.existsSync(fileName))
    {
        return cb("file " + fileName + " does not exist");
    }

    fs.unlink(fileName, function(err, msg)
    {
        if (err)
            return cb(err);

        return cb(null, "file deleted");
    });
};

exports.list = function(cb)
{
    glob(config.mediaBasePath + "/*(*.mp3|*.wav)", {}, function(err, audios)
    {
        if (err)
        {
            return cb(err);
        }

        var sortedFiles = audios.sort(function(a, b)
        {
            return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
        });

        var listing = [];

        sortedFiles.forEach(function(a)
        {
            listing.push({
                fileName: path.basename(a),
                date: fs.statSync(a).mtime.getTime(),
                extension: path.extname(a)
            });
        });

        return cb(null, listing);
    });
};