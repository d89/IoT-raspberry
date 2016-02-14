var logger = require('../logger');

exports.exposed = function()
{
    return {
        act: exports.act
    };
};

exports.act = function(displaycontent)
{
    //make array
    if (!displaycontent.splice)
    {
        displaycontent = [displaycontent];
    }

    var spawn = require('child_process').spawn;
    var prc = spawn('/var/www/IoT-raspberry/sensors/display', displaycontent);
    prc.stdout.setEncoding('utf8');
};