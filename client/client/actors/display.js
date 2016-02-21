var logger = require('../logger');
var config = require('../config');
var spawn = require('child_process').spawn;

exports.exposed = function()
{
    return {
        act: {
            method: exports.act,
            params: [{
                name: "displaycontent",
                isOptional: false,
                dataType: "string or array",
                notes: "The text that should be shown on the display"
            }]
        }
    };
};

exports.act = function(displaycontent)
{
    //make array
    if (!displaycontent.splice)
    {
        displaycontent = [displaycontent];
    }

    var prc = spawn(config.baseBath + '/sensors/display', displaycontent);
    prc.stdout.setEncoding('utf8');
};