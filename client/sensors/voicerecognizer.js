"use strict";

var baseSensor = require("./baseSensor");
var spawn = require("child_process").spawn;
var exec = require("child_process").exec;
var config = require("../config");
var actormanagement  = require("../actormanagement");

// ######################################################

class voicerecognizer extends baseSensor
{
    constructor(options)
    {
        super("voicerecognizer", false, options);
        this.kill();

        this.listen(function(matched)
        {
            if (matched.indexOf("okay pi") !== -1)
            {
                //exec("timeout 0.02s speaker-test -t sine");
                //actormanagement.registeredActors["music"].play("recognized.mp3");
                require("../soundmanager").play(config.mediaBasePath + "/recognized.mp3");
            }
        });
    }

    receiveLine(str)
    {
        return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
    };

    kill()
    {
        exec("kill $(ps aux | grep '[p]ocketsphinx_continuous' | awk '{print $2}')");
    }

    listen(onmatch)
    {
        var that = this;
        var executable = that.options.executable;
        var mic = "plughw:" + config.soundCardInput;
        var params = ["-lm", that.options.languageModel, "-dict", that.options.dictionary, "-adcdev", mic];

        var prc = spawn(executable, params);
        prc.stdout.setEncoding("utf8");
        prc.stdout.on("data", function (data)
        {
            data = that.receiveLine(data);
            var matches = data.split(/\d+\:\s/);

            if (matches.length === 1)
            {
                //that.logger.info("voicerec", matches[0]);
            }
            else
            {
                var mached = matches[1].toLowerCase();
                that.logger.info("voicerec", mached);
                onmatch(mached)
            }
        });

        prc.on("error", function (error)
        {
            this.logger.error("voicerec", error);
        });
    }
}

module.exports = voicerecognizer;