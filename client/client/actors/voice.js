var logger = require('../logger');
var config = require('../config');
var request = require('request');
var fs = require('fs');
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var glob = require('glob');
const MAX_KEEP_FILES = 5;

exports.exposed = function()
{
    return {
        act: {
            method: exports.act,
            params: [{
                name: "text",
                isOptional: false,
                dataType: "string",
                notes: "text that should be spoken."
            }]
        }
    };
};

exports.deleteOldFiles = function()
{
    glob(config.mediaBasePath + "/voice-*.mp3", {}, function(err, files)
    {
        if (err)
        {
            return logger.error("error grepping: " + err);
        }

        var sortedFiles = files.sort(function(a, b)
        {
            return fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime();
        });

        var filesToDelete = sortedFiles.length - MAX_KEEP_FILES;

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

exports.act = function(text)
{
    logger.info("voice acting");

    exports.deleteOldFiles();

    var play = function(fileName)
    {
        spawn('/usr/bin/mpg321', [fileName]);
    };

    var ttsApiKey = config.ttsApiKey;
    text = text || "no text given";
    var speakerLanguage = "en-us";
    var speed = 0; //-10 = slowest, 10 = fastest
    var url = "https://api.voicerss.org/?key=" + ttsApiKey + "&src=" + text + "&hl=" + speakerLanguage + "&r=" + speed + "&f=44khz_16bit_stereo";
    var fileName = "voice-" + crypto.createHash('md5').update(url).digest('hex') + ".mp3";
    fileName = config.mediaBasePath + "/" + fileName;

    if (fs.existsSync(fileName))
    {
        logger.info("voice actor from cache");
        play(fileName);
        return;
    }

    request(url).on("error", function(err)
    {
        logger.error("voice rec error " + err);
    })
    .pipe(fs.createWriteStream(fileName))
    .on("finish", function()
    {
        logger.info("voice live rec finished");
        play(fileName);
    });
};