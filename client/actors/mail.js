"use strict";

var baseActor = require("./baseActor");
var config = require('../config');
var socketmanager = require('../socketmanager');

// ######################################################

class mail extends baseActor
{
    constructor(options)
    {
        super("mail", options);
    }

    exposed()
    {
        return {
            mail: {
                method: this.mail.bind(this),
                params: [{
                    name: "to",
                    isOptional: false,
                    dataType: "string",
                    notes: "Full mail address of the receiver."
                },{
                    name: "subject",
                    isOptional: false,
                    dataType: "string",
                    notes: "subject of the mail."
                },{
                    name: "text",
                    isOptional: false,
                    dataType: "string",
                    notes: "text to send by mail."
                }]
            }
        };
    }

    mail(to, subject, text, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("mailed", err, resp);
        };

        socketmanager.socket.emit("client:mail", {
            to: to,
            subject: subject,
            text: text
        }, function(err, msg)
        {
            cb(err, msg);
        });
    }
}

module.exports = mail;