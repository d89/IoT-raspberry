var config = require("./config");
var logger = require("./logger");
var request = require("request");

exports.get = function(urlPath, cb)
{
    var url = "http://127.0.0.1:" + config.fhem.port + "/" + urlPath;

    request.get(url,
    {
        auth: {
            user: config.fhem.basic_auth_username,
            pass: config.fhem.basic_auth_password
        }
    }, function (error, response, body)
    {
        if (error)
        {
            cb("fhem get error " + error + " for " + url);
        }
        else if (response && response.statusCode && response.statusCode != 200)
        {
            cb("fhem homematic get desired temperature response code " + response.statusCode + " for " + url);
        }
        else //success
        {
            cb(null, body);
        }
    });
};

exports.post = function(urlPath, requestObject, cb)
{
    var url = "http://127.0.0.1:" + config.fhem.port + "/" + urlPath;

    request.post(url, {
        form: requestObject,
        auth: {
            user: config.fhem.basic_auth_username,
            pass: config.fhem.basic_auth_password
        }
    }, function (error, response, body)
    {
        if (error)
        {
            cb("fhem post error " + error + " for " + JSON.stringify(requestObject));
        }
        else if (response && response.statusCode && response.statusCode != 200 && response.statusCode != 302)
        {
            cb("fhem post response code " + response.statusCode + " for " + JSON.stringify(requestObject));
        }
        else //success
        {
            cb(null, body);
        }
    });
};