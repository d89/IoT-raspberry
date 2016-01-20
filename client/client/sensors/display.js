var logger = require('../logger');

exports.display = function(displaycontent)
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

//exports.display(["line 1", "line 2"]);