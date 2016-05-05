'use strict';

var baseSensor = require("./baseSensor");
var request = require('request');
var moment = require("moment");

// ######################################################

class sun extends baseSensor {

    constructor(options) {
        super("sun", "Sunrise Sunset", options);
        var that = this;
        that.debug = false;
        
        if(that.debug) {
            that.logger.info("Float Lat: " + parseFloat(options.latitude));
            that.logger.info("Float Lon: " + parseFloat(options.longitude));
        }
        
        if(!options.latitude || 
           !options.longitude ||
           !parseFloat(options.latitude) ||
           !parseFloat(options.longitude)) {
            throw new Error("Faulty options!");
        }

        that.url = function () {
            var querydate = moment().format("Y-M-D");
            return "http://api.sunrise-sunset.org/json?lat=" + options.latitude + "&lng=" + options.longitude + "&formatted=0&date=" + querydate;
        };

        setInterval(function () {
            that.read();
        }, that.options.interval * 1000);
    }

    exposed(val) {
        var that = this;

        return {
            is_up: {
                method: function () {
                    if (!that.validateDataPresence()) return false;

                    var sensordata = parseFloat(that.sensordata.is, 10);

                    var triggered = (sensordata == 1);
                    return that.processCondition("is_up", null, triggered);
                },
                params: []
            },
            is_down: {
                method: function () {
                    if (!that.validateDataPresence()) return false;

                    var sensordata = parseFloat(that.sensordata.is, 10);

                    var triggered = (sensordata == 0);
                    return that.processCondition("is_down", null, triggered);
                },
                params: []
            },
            /*
            // If IFTT could handle queries like $time.is_gt($sun.get_sunset());
            get_sunset: {
                method: function () {
                    if (!that.sunset) return false;

                    return that.sunset.format("HHmmss");
                },
                params: []
            },
            get_sunrise: {
                method: function () {
                    if (!that.sunrise) return false;

                    return that.sunrise.format("HHmmss");
                },
                params: []
            }
            */

        }
    }

    read() {
        var that = this;
        var now = moment();

        /**
         * Query API once a day
         */
        if (!that.lastRequest || !moment(that.lastRequest).isSame(now, 'day')) {

            if (that.debug) {
                this.logger.info("Sunset API URL: " + that.url());
            }
            
            request.get(that.url(), function (error, response, body) {
                if (error) {
                    that.logger.error(error + " for " + that.url());
                } else if (response && response.statusCode && response.statusCode != 200) {
                    that.logger.error("status code " + response.statusCode + " for " + that.url());
                } else {
                    var data = JSON.parse(body);

                    that.sunrise = moment(data.results.sunrise);
                    that.sunset = moment(data.results.sunset);

                    that.lastRequest = now;

                    if (that.debug) {
                        that.logger.info("Requested SunsetSunrise API");
                    }
                }
            });
        }

        if (!!that.lastRequest && !!that.sunrise && !!that.sunset) {
            if (!(that.sunrise.isValid() && that.sunset.isValid())) {
                that.logger.error("sunrise/sunset is no valid time!");
                return;
            }

            if (that.debug) {
                that.logger.info("Last Request Time: " + that.lastRequest.format() + " ");
                that.logger.info("Now:               " + now.format());
                that.logger.info("Is same day:       " + moment(that.lastRequest).isSame(now, 'day'));
                that.logger.info("Sunrise at         " + that.sunrise.format());
                that.logger.info("Sunset at          " + that.sunset.format());
                that.logger.info("Sun is up:         " + (now.isAfter(that.sunrise) && now.isBefore(that.sunset)));
            }

            var result = (now.isAfter(that.sunrise) && now.isBefore(that.sunset)) ? 1 : 0;
            that.senddata(result, this);
        }
    }
}

module.exports = sun;