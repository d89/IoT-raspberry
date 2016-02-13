var spawn = require('child_process').spawn;

var processMap = {};

exports.processKey = function(path, params)
{
    return path + "-" + params.join("-");
};

exports.spawn = function(path, params, ondata, onerror, onclose)
{
    var processKey = exports.processKey(path, params);

    if (processKey in processMap)
    {
        ondata && processMap[processKey].onOutput.push(ondata);
        onerror && processMap[processKey].onError.push(onerror);
        onclose && processMap[processKey].onClose.push(onclose);
        return processMap[processKey];
    }

    processMap[processKey] =
    {
        process: spawn(path, params || []),
        onOutput: [],
        onError: [],
        onClose: []
    };

    processMap[processKey].process.stdout.setEncoding('utf8');
    processMap[processKey].process.stdout.on("data", function(data)
    {
        processMap[processKey].onOutput.forEach(function(o)
        {
            o(data);
        })
    });

    processMap[processKey].process.stderr.on("data", function(data)
    {
        processMap[processKey].onError.forEach(function(o)
        {
            o(data);
        })
    });

    processMap[processKey].process.on("close", function(data)
    {
        processMap[processKey].onClose.forEach(function(o)
        {
            o(data);
        })
    });

    ondata && processMap[processKey].onOutput.push(ondata);
    onerror && processMap[processKey].onError.push(onerror);
    onclose && processMap[processKey].onClose.push(onclose);

    return processMap[processKey];
};
