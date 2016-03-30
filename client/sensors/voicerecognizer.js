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

    exposed(val)
    {
        var that = this;

        return {
            on: {
                method: function(val)
                {
                    if (!that.sensordata || that.sensordata.is == null || typeof that.sensordata.is == "undefined")
                    {
                        return false;
                    }

                    val = (val + "").toLowerCase();
                    var lastTalk = ("" + that.sensordata.is).toLowerCase();
                    var triggered = (lastTalk == val);
                    return that.processCondition("is_equal", val, triggered);
                },
                params: [{
                    name: "val",
                    isOptional: false,
                    dataType: "string",
                    notes: "The text to react to, when recognized"
                }]
            }
        };
    }

    dependenciesFulfilled()
    {
        if (!actormanagement.has("recorder") || !actormanagement.has("music"))
            return "recorder and music required";

        return true;
    }

    stripNewLines(str)
    {
        return str.toString().replace(/(\r\n|\n|\r)/gm,"");
    }

    hotwords()
    {
        return ["okay pi", "hello pi", "listen pi"]; //all lowercase without punctuation
    }

    killTTS(cb)
    {
        this.logger.info("voicerec", "stopping tts engine");
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
        var found = false;

        for (var i = 0; i < hotwords.length; i++)
        {
            if (text.indexOf(hotwords[i]) !== -1)
            {
                found = hotwords[i];
                break;
            }
        }

        if (found === false)
        {
            that.logger.info("voicerec", "is no hotword " + text);
            return;
        }

        that.logger.info("voicerec", "got hotword " + found);

        //if you don't have a file "recognized.mp3" in your media library, a beep will be played
        actormanagement.registeredActors["music"].play("recognized.mp3", false, function()
        {
            that.googleRecognition(function(err, msg)
            {
                that.listenForHotword();

                if (err) {
                    that.logger.error("voicerec", err);
                } else {
                    that.processUserTextFromGoogle(msg);
                }
            });
        });
    }

    processUserTextFromGoogle(text)
    {
        this.logger.info("voicerec", "understood: " + text);
        this.senddata(text, this);
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
                    stdout = that.stripNewLines(stdout);
                    stderr = that.stripNewLines(stderr);

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
                            stdout = that.stripNewLines(stdout);
                            stderr = that.stripNewLines(stderr);

                            if (error)
                            {
                                return cb("error from google stt: " + error + ", " + stderr);
                            }

                            try
                            {
                                //strip out the first empty response. For whatever reason, google gives
                                //a '{"result":[]}' at first before returning the real result, even when
                                //we got a successful response
                                var empty = '{"result":[]}';
                                stdout = ("" + stdout).replace(empty, "");

                                if (stdout.length <= empty.length)
                                {
                                    throw new Error("empty response");
                                }

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

                                throw new Error("non successfull response");
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

        /*
        //Language Model for english, if this makes sense for your context.
        params.push("-hmm");
        params.push("/opt/voicerec/pocketsphinx-python/pocketsphinx/model/en-us/en-us");
        */

        //console.log(executable + " " + params.join(" "));

        var isReady = false;
        var prc = spawn(executable, params);
        prc.stdout.setEncoding("utf8");

        prc.stdout.on("data", function(data)
        {
            data = that.stripNewLines(data).toLowerCase();
            that.logger.info("voicerec", "received: " + data);

            //is ready the first time and has not been ready before
            if (data.indexOf("ready") !== -1 && isReady === false)
            {
                isReady = true;
                that.beep();
                return;
            }

            //can look like this: payload! -> 000000196: okay pi
            var containsSequenceNumber = !isNaN(parseInt(data, 10));
            var isHotword = containsSequenceNumber && data.split(":").length === 2;

            if (isHotword)
                that.processHotword(data.split(":")[1]);
        });

        //pocketsphinx likes to spit out loads of stuff on stderr, which in fact is no error
        //on top of that, stdout seems to be distorted if we receive output on stderr, so we
        //better skip that
        prc.stderr.on("data", function(data)
        {
            //that.logger.error(that.stripNewLines(data));
        });

        prc.on("close", function(exitCode)
        {
            that.logger.info("voicerec", "closing with exitCode " + exitCode);
        });
    }
}

module.exports = voicerecognizer;
