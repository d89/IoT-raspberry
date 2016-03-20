"use strict";

var baseSensor = require("./baseSensor");
var spawn = require("child_process").spawn;
var exec = require("child_process").exec;
var config = require("../config");
var actormanagement  = require("../actormanagement");
var fs = require("fs");

// ######################################################

class voicerecognizer extends baseSensor
{
    constructor(options)
    {
        super("voicerecognizer", false, options);

        var that = this;

        that.killTTS(function()
        {
            that.listenForHotword();
        });
    }

    hotwords()
    {
        return ["okay pi", "hello pi", "listen pi"]; //all lowercase without punctuation
    }

    commands()
    {
        //put here whatever you want to
        //commands all lowercase without punctuation
        var commands =
        {
            "lights on": function()
            {
                console.log("turning lights on, if you comment this out");
                //actormanagement.registeredActors["switchrc"].switch1on();
            },
            "lights off": function()
            {
                console.log("turning lights off, if you comment this out");
                //actormanagement.registeredActors["switchrc"].switch1off();
            }
        };

        return commands;
    }

    receiveLine(str)
    {
        return ("" + str).replace(/(\r\n|\n|\r)/gm,"");
    };

    killTTS(cb)
    {
        this.logger.info("stopping tts engine");
        var killCommand = "kill -9 $(ps aux | grep '" + this.options.executable + "' | awk '{print $2}')";
        exec(killCommand, cb);
    }

    beep(cb)
    {
        actormanagement.registeredActors["music"].beep(false, cb);
    }

    processHotword(text)
    {
        var that = this;
        var hotwords = that.hotwords();
        if (hotwords.indexOf(text) === -1) return;

        that.logger.info("got hotword " + text);

        actormanagement.registeredActors["music"].play("recognized.mp3", false, function()
        {
            that.googleRecognition(function(err, msg)
            {
                that.listenForHotword();

                if (err) {
                    that.logger.error(err);
                } else {
                    that.processUserTextFromGoogle(msg);
                }
            });
        });
    }

    processUserTextFromGoogle(text)
    {
        var commands = this.commands();

        if (text in commands)
        {
            commands[text]();
        }
        else
        {
            this.logger.info("unknown command from google: " + text);
        }
    }

    googleRecognition(cb)
    {
        var that = this;

        var duration = 4; //seconds
        var sampleRate = 16000; //hertz
        var mono = 1; //stereo does not work properly
        var tempFile = "/tmp/voicerec.flac";
        var language = "en-us";
        var apiKey = that.options.googleVoiceApiKey;
        var url = "https://www.google.com/speech-api/v2/recognize?output=json&lang=" + language + "&key=" + apiKey;

        //tts engine needs to be killed. Otherwise, it blocks the microphone
        that.killTTS(function()
        {
            //beep to show that the user can start speaking now
            that.beep(function()
            {
                //record a wav file for <duration>s and pipe it to FLAC conversion
                //this works best with the google api
                exec("arecord -D plughw:1,0 -f cd -t wav -d " + duration + " -r " + sampleRate + " -c " + mono + " | flac - -f --best --sample-rate " + sampleRate + " -o " + tempFile, function(error, stdout, stderr)
                {
                    if (error || !fs.existsSync(tempFile))
                    {
                        return cb("could not record audio: " + error + ", " + stderr);
                    }

                    //beep to show that we are done recording and start processing
                    that.beep(function()
                    {
                        //upload FLAC to google
                        exec("curl -X POST --data-binary @'" + tempFile + "' --header 'Content-Type: audio/x-flac; rate=" + sampleRate + ";' '" + url + "'", function(error, stdout, stderr)
                        {
                            if (error)
                            {
                                return cb("error from google stt: " + error + ", " + stderr);
                            }

                            try
                            {
                                //strip out the first empty response. For whatever reason, google gives
                                //a '{"result":[]}' at first before returning the real result, even when
                                //we got a successful response
                                stdout = ("" + stdout).replace('{"result":[]}', "");

                                var result = JSON.parse(stdout);

                                //validation madness
                                var isValidResponse =   "result" in result
                                                        && result.result.length > 0
                                                        && "alternative" in result.result[0]
                                                        && result.result[0].alternative.length > 0
                                                        && "transcript" in result.result[0].alternative[0];

                                /*
                                //stays here for debugging, if that should be ever necessary
                                console.log("0", "result" in result);
                                console.log("1", result.result.length > 0);
                                console.log("2", "alternative" in result.result[0]);
                                console.log("3", result.result[0].alternative.length > 0);
                                console.log("4", "transcript" in result.result[0].alternative[0]);
                                */

                                if (isValidResponse)
                                    return cb(null, result.result[0].alternative[0].transcript.toLowerCase());

                                throw "non successfull response";
                            }
                            catch (ex)
                            {
                                return cb("invalid json from google: " + stdout + ": " + ex);
                            }
                        });
                    });
                });
            });
        });
    }

    listenForHotword()
    {
        var that = this;
        var executable = that.options.executable;
        var mic = "plughw:" + config.soundCardInput + ",0";
        var params = ["-lm", that.options.languageModel, "-dict", that.options.dictionary, "-adcdev", mic];
        var isReady = false;

        var prc = spawn(executable, params);
        prc.stdout.setEncoding("utf8");
        prc.stdout.on("data", function (data)
        {
            data = that.receiveLine(data);
            var matches = data.split(/\d+\:\s/);

            if (matches.length === 1)
            {
                //that.logger.info("voicerec", matches[0]);

                if (matches[0].indexOf("READY") !== -1 && isReady === false)
                {
                    isReady = true;
                    that.beep();
                }
            }
            else
            {
                var text = matches[1].toLowerCase();

                if (text && text.length)
                    that.processHotword(text)
            }
        });

        prc.on("error", function (error)
        {
            this.logger.error("voicerec", error);
        });
    }
}

module.exports = voicerecognizer;