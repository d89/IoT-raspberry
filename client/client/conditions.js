exports.conditions = [];

exports.add = function(expression, callback)
{
    exports.conditions.push({
        expression: expression,
        callback: callback
    });
};