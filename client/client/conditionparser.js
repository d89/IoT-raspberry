exports.statements = [
    " if     (true || $poti.gt(60) || $distance.gt(130) && (!($movement2.is(1) || $distance.lte(100))&&$movement2.is(0))) { $lol.act(); ;;;  $lol2.act(333); }",
    "if (true) {  $ledRed.act(); }"
];

exports.escapeRegExp = function(str)
{
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

exports.validTokensIfClause = ["true", "false", "||", "&&", "(", ")", "!"];

exports.validTokensThenClause = [";"];

exports.process = function(type, data, sensors, actors)
{
    exports.statements.forEach(function(statement)
    {
        try
        {
            console.log("-----------------------------------")

            var clauses = exports.validateStructure(statement);

            var ifClause = clauses.if;
            var thenClause = clauses.then;

            console.log("ifclause", ifClause);
            console.log("thenclause", thenClause);
            console.log("###");

            var condition = exports.processIfClause(ifClause, sensors);

            console.log("evaluated", condition.evaluated);
            console.log("executed", condition.executed);

            if (condition.executed === true)
            {
                var callResults = exports.processThenClause(thenClause, actors);
                console.log("successfully executed clause with return values", callResults);
            }
            else
            {
                console.log("do not exectute 'then' clause");
            }
        }
        catch (err)
        {
            console.error(`Condition Evaluation error for ${statement}`, err);
        }

        console.log("-----------------------------------")
    });
};

exports.validateStructure = function(statement)
{
    //conditions are formed like
    // if (condition) { $statement1(); $statement2(); }

    //test for the "if" condition
    var parsed = statement.split(/^(\s+)?if\s+?\((.*?)\)\s+?\{(.*?)\}(\s+)?$/g);

    //general statement structure
    //the first and last element has to be empty
    if (parsed.length !== 6 || parsed[0] !== "" || parsed[5] !== "")
    {
        throw new Error("Invalid statement construction");
    }

    //validate the allowed spaces
    if (!(parsed[1] === undefined || /^(\s+)?$/.test(parsed[1]) === true))
    {
        throw new Error("Invalid statement construction in start of statement");
    }

    if (!(parsed[4] === undefined || /^(\s+)?$/.test(parsed[4]) === true))
    {
        throw new Error("Invalid statement construction in end of statement");
    }

    return {
        if: parsed[2],
        then: parsed[3]
    };
};

exports.processIfClause = function(ifClause, sensors)
{
    //match everything from $ until the first closing brace -> $foo.bar(1234)
    var reg = /\$([^\)]+\))/g;
    //evaluate method calls
    var evaluated = ifClause.replace(reg, function(match, contents, offset, s)
    {
        contents = contents.split(".");

        if (contents.length !== 2)
        {
            throw new Error("Invalid method call: " + contents.join("."));
        }

        var sensorType = contents[0];
        var method = contents[1].split(/[\(\)]/g);
        var methodName = method[0];
        var parameters = method[1];

        if (!sensorType || !(sensorType in sensors))
        {
            throw new Error("Invalid Sensor Type " + sensorType);
        }

        var sensor = sensors[sensorType];
        var exposedMethods = sensor.exposed();

        if (!methodName || !(methodName in exposedMethods))
        {
            throw new Error("Invalid Method Name " + methodName);
        }

        return exposedMethods[methodName](parameters)
    });

    var reducedCondition = evaluated;

    exports.validTokensIfClause.forEach(function(token)
    {
        var regex = new RegExp(exports.escapeRegExp(token), "g");
        reducedCondition = reducedCondition.replace(regex, "");
    });

    var invalidTokens = reducedCondition.match(/\S+/g);
    var isValid = null === invalidTokens;

    if (!isValid)
    {
        throw new Error("Invalid tokens: " + invalidTokens.join(" "));
    }

    var executed = null;

    try
    {
        executed = eval(evaluated);
    }
    catch (evalError)
    {
        throw new Error("Condition could not be evaluated: " + evalError);
    }

    return {
        evaluated: evaluated,
        executed: executed
    };
};

exports.processThenClause = function(thenClause, actors)
{
    console.log("###");
    console.log("processing thenClause", thenClause);

    //structure: $actor1.foo(123); $actor2.bar("asdf");
    // $actorname.methodname(params);
    var methodCalls = thenClause.split(/(\$\w+\.\w+\(.*?\);?)/g);
    var extractedActorCalls = [];

    methodCalls.forEach(function(m)
    {
        var actorCall = m.split(/\$(\w+)\.(\w+)\((.*?)\);?/g);

        //console.log("splitted actor call", actorCall);

        if (actorCall.length === 5)
        {
            //already ensured by previous regex, that first and last element is empty

            extractedActorCalls.push({
                // actorCall[0] === ""
                actor: actorCall[1],
                method: actorCall[2],
                params: actorCall[3],
                raw: m
                // actorCall[4] === ""
            });
        }
        else
        {
            var reducedCall = m;

            exports.validTokensThenClause.forEach(function(token)
            {
                var regex = new RegExp(exports.escapeRegExp(token), "g");
                reducedCall = reducedCall.replace(regex, "");
            });

            var invalidTokens = reducedCall.match(/\S+/g);

            if (invalidTokens !== null)
            {
                throw new Error("Then clause invalid tokens: " + invalidTokens.join(" "));
            }
        }
    });

    if (extractedActorCalls.length === 0)
    {
        throw new Error("no commands given");
    }

    //console.log("syntactically valid actor calls: ", extractedActorCalls);

    var callResults = [];

    extractedActorCalls.forEach(function(actorCall)
    {
        var rawCall = actorCall.raw;
        var actorType = actorCall.actor;
        var methodName = actorCall.method;
        var parameters = actorCall.params;

        console.log("calling -> " + rawCall);

        if (!actorType || !(actorType in actors))
        {
            throw new Error("Invalid Actor Type " + actorType);
        }

        var actor = actors[actorType];
        var exposedMethods = actor.exposed();

        if (!methodName || !(methodName in exposedMethods))
        {
            throw new Error("Invalid Method Name " + methodName);
        }

        try
        {
            var result = exposedMethods[methodName](parameters);
        }
        catch (callErr)
        {
            throw new Error("Error calling " + rawCall + ": " + callErr);
        }

        callResults.push({
            call: rawCall,
            result: result
        });
    });

    return callResults;
};