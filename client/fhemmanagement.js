var config = require("./config");
var logger = require("./logger");
var request = require("request");
var querystring = require("querystring");

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

exports.setValue = function(deviceName, attribute, value, cb)
{
    var attrs = {};
    attrs["detail"] = deviceName;
    attrs["dev.set" + deviceName] = deviceName;
    attrs["cmd.set" + deviceName] = "set";
    attrs["arg.set" + deviceName] = attribute;
    attrs["val.set" + deviceName] = value;
    attrs["XHR"] = "1";

    return exports.post("fhem", attrs, cb);
};

exports.readValue = function(deviceName, attribute, cb)
{
    var requestObject = '{ReadingsVal("' + deviceName + '","' + attribute + '","")}';
    var url = "fhem?cmd=" + requestObject + "&XHR=1";
    return exports.get(url, cb);
};

exports.refreshAttribute = function(deviceName, refreshattribute, cb)
{
    var attrs = {};
    attrs["detail"] = deviceName;
    attrs["dev.get" + deviceName] = deviceName;
    attrs["cmd.get" + deviceName] = "get";
    attrs["arg.get" + deviceName] = refreshattribute;
    attrs["val.get" + deviceName] = "";
    attrs["XHR"] = "1";

    var url = "fhem?" + querystring.stringify(attrs);

    return exports.get(url, cb);
};