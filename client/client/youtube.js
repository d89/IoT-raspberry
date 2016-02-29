var logger = require('./logger');
var config = require('./config');
var spawn = require('child_process').spawn;
var glob = require('glob');
var path = require('path');

var receiveLine = function(str) {
    return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
};

var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

//from http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
var idExtractor = function(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
};

exports.download = function(ytID, onout, ondone)
{
    //accept both youtube ids and full urls.
    //if we receive a full url, extract to see if things are fine
    if (idExtractor(ytID))
    {
        ytID = idExtractor(ytID);
    }

    if (!ytID) return ondone(-1, "Invalid youtube ID");

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
                ondone(0, path.basename(file));
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
            data = receiveLine(data);

            var fileCheck = data.split("/");
            fileCheck = fileCheck[fileCheck.length - 1];

            if (endsWith(fileCheck, ".mp3"))
            {
                extractedFilename = fileCheck;
            }

            onout("OUTPUT: " + data);
        });

        process.on("close", function(retCode)
        {
            ondone(retCode, extractedFilename);
        });
    };

    // ----------------------------------------------

    search();
};