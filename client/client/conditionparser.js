var fs = require("fs");
var logger = require("./logger");
var sensormanagement = require("./sensormanagement");
var actormanagement = require("./actormanagement");
var socketmanager = require("./socket");

const DEBUG = false;

// --------------------------------------------------

exports.statements = [];

exports.saveCallResult = function(status, text, executedStatement)
{
    if (!(executedStatement in exports.statements))
    {
        return logger.error("unknown statement " + executedStatement);
    }

    exports.statements[executedStatement].lastMessage = text;
    exports.statements[executedStatement].lastState = status;

    if (status !== true)
    {
        exports.statements[executedStatement].lastErrorTime = (new Date).getTime();
    }
    else
    {
        exports.statements[executedStatement].lastSuccessTime = (new Date).getTime();
    }

    exports.sendStatusUpdateToServer();
};

exports.saveTestCallResult = function(status, text)
{
    var testResult = {
        lastMessage: text,
        lastState: status,
        lastSuccessTime: false,
        lastErrorTime: false
    };

    if (status !== true)
    {
        testResult.lastErrorTime = (new Date).getTime();
    }
    else
    {
        testResult.lastSuccessTime = (new Date).getTime();
    }

    return testResult;
};

exports.sendStatusUpdateToServer = function()
{
    socketmanager.socket.emit("client:iftttupdate", exports.statements);
};

exports.testConditions = function(testconditions, cb)
{
    var sensors = sensormanagement.registeredSensors;
    var actors = actormanagement.registeredActors;

    console.log("Testing conditions", testconditions);

    var testResponse = {};

    testconditions.forEach(function(statementObject)
    {
        if (!statementObject.isActive) return;

        var statement = statementObject.conditiontext;

        try
        {
            var clauses = exports.validateStructure(statement);
            var ifClause = clauses.if;
            var thenClause = clauses.then;
            var condition = exports.processIfClause(ifClause, sensors);
            var callResults = exports.processThenClause(thenClause, actors, true);

            testResponse[statement] = exports.saveTestCallResult(true, callResults);
        }
        catch (err)
        {
            testResponse[statement] = exports.saveTestCallResult(false, "" + err);
        }
    });

    cb(null, testResponse);
};

exports.loadAvailableOptions = function(cb)
{
    var sensors = sensormanagement.registeredSensors;
    var actors = actormanagement.registeredActors;

    //console.log("exposed sensors", regSensors.exposed())

    var exposedActors = [];

    for (var actor in actors)
    {
        var methods = [];

        if ("exposed" in actors[actor])
        {
            var exposed = actors[actor].exposed();

            for (var exposedMethod in exposed)
            {
                methods.push({
                    method: exposed[exposedMethod].method,
                    name: exposedMethod,
                    params: exposed[exposedMethod].params
                });
            }
        }

        exposedActors.push({
            name: actor,
            methods: methods
        });
    }

    var exposedSensors = [];

    for (var sensor in sensors)
    {
        var methods = [];

        if ("exposed" in sensors[sensor])
        {
            var exposed = sensors[sensor].exposed();

            for (var exposedMethod in exposed)
            {
                methods.push({
                    method: exposed[exposedMethod].method,
                    name: exposedMethod,
                    params: exposed[exposedMethod].params
                });
            }
        }

        exposedSensors.push({
            name: sensor,
            methods: methods
        });
    }

    var options = {
        actors: exposedActors,
        sensors: exposedSensors
    };

    //console.log("returning available options", options);

    cb(null, options);
};

exports.loadConditions = function(cb)
{
    fs.readFile("../conditions.json", function(err, file)
    {
        if (err)
        {
            logger.error("condition list", err);
            file = "[]";
        }

        return cb(null, file);
    });
};

//set the conditions from the file as current scope
exports.applyConditions = function(cb)
{
    exports.loadConditions(function(err, statementsFromFile)
    {
        if (err)
        {
            statementsFromFile = "[]";
        }

        try
        {
            statementsFromFile = JSON.parse(statementsFromFile);
        }
        catch (err)
        {
            statementsFromFile = [];
        }

        var newStatements = {};

        statementsFromFile.forEach(function(s)
        {
            //in file but not in current array -> add
            var conditionIsNew = !(s.conditiontext in exports.statements);

            if (conditionIsNew && s.isActive)
            {
                newStatements[s.conditiontext] = {
                    lastSuccessTime: false,
                    lastErrorTime: false,
                    lastMessage: false,
                    lastState: null
                };
            }

            if (!conditionIsNew && s.isActive)
            {
                var takeOver = exports.statements[s.conditiontext];
                newStatements[s.conditiontext] = takeOver;
            }
        });

        //overwrite all current statements. This way, the old ones are kicked
        exports.statements = newStatements;

        cb();
    });
};

exports.saveConditions = function(conditions, cb)
{
    fs.writeFile("../conditions.json", conditions, function(err)
    {
        if (err)
        {
            err = err.toString();
            logger.error("condition save", err);
            return cb(err);
        }

        return cb(null, "saved conditions");
    });
};

exports.escapeRegExp = function(str)
{
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

exports.validTokensIfClause = ["true", "false", "||", "&&", "(", ")", "!"];
exports.validTokensThenClause = [";"];

exports.process = function(type, data)
{
    var sensors = sensormanagement.registeredSensors;
    var actors = actormanagement.registeredActors;
    var allSensors = [];

    exports.applyConditions(function()
    {
        for (var statement in exports.statements)
        {
            try
            {
                DEBUG && console.log("-----------------------------------")

                var clauses = exports.validateStructure(statement);

                var ifClause = clauses.if;
                var thenClause = clauses.then;

                DEBUG && console.log("ifclause", ifClause);
                DEBUG && console.log("thenclause", thenClause);
                DEBUG && console.log("###");

                var condition = exports.processIfClause(ifClause, sensors);

                condition.method.forEach(function(m)
                {
                    allSensors.push(m);
                });

                var exec = condition.executed;

                DEBUG && console.log("evaluated", condition.evaluated);
                DEBUG && console.log("executed", condition.executed);

                if (condition.executed === true)
                {
                    var callResults = exports.processThenClause(thenClause, actors);
                    DEBUG && console.log("successfully executed clause with return values", callResults);

                    exports.saveCallResult(true, callResults, statement);
                }
                else
                {
                    DEBUG && console.log("do not exectute 'then' clause");
                }
            }
            catch (err)
            {
                exports.saveCallResult(false, "" + err, statement);
                console.error(`Condition Evaluation error for ${statement}`, err.stack);
            }

            DEBUG && console.log("-----------------------------------")
        }
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

exports.conditionEvaluationMemory = {};

exports.processIfClause = function(ifClause, sensors)
{
    //match everything from $ until the first closing brace -> $foo.bar(1234)
    var reg = /\$([^\)]+\))/g;

    var methods = [];

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
        var parameters = exports.processParamInput(method[1]);

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

        methods.push(exposedMethods[methodName]);

        exports.validateParameterPresence(methodName, exposedMethods[methodName].params, parameters);

        return exposedMethods[methodName].method.apply(this, parameters);
    });

    var evaluationDidRun = evaluated !== "";

    if (!evaluationDidRun)
    {
        throw new Error("Empty / Invalid condition.");
    }

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

    var sentExecuted = null;
    var realExecuted = null;

    try
    {
        if (!(ifClause in exports.conditionEvaluationMemory))
        {
            DEBUG && console.log("setting ifClause initially");
            exports.conditionEvaluationMemory[ifClause] = false;
        }

        DEBUG && console.log("----------------------------------");
        DEBUG && console.log(ifClause);
        realExecuted = eval(evaluated);
        DEBUG && console.log("evaluated", evaluated);
        DEBUG && console.log("real executed", realExecuted);

        if (exports.conditionEvaluationMemory[ifClause] === false && realExecuted === true)
        {
            DEBUG && console.log("setting condition evaluation to true");
            sentExecuted = true;
        }
        else
        {
            sentExecuted = false;
        }

        DEBUG && console.log("sent executed", sentExecuted);

        exports.conditionEvaluationMemory[ifClause] = realExecuted;
    }
    catch (evalError)
    {
        throw new Error("Condition could not be evaluated: " + evalError);
    }

    return {
        evaluated: evaluated,
        executed: sentExecuted,
        method: methods
    };
};

//expects the params as a string, like: 155, 255, "foobar"
exports.processParamInput = function(paramString)
{
    //split at , for multiple parameters
    var params = paramString.split(/\s*,\s*/g);

    //remove parameter quotes, as they are wrapped twice
    params = params.map(function(e) {
        e = e.replace(/[\"\']/g, "");
        return e;
    });

    //special case, because $sensor.method() or $actor.method() is reported as empty string parameter
    if (params.length === 1 && params[0] === "")
    {
        params = [];
    }

    return params;
};

exports.validateParameterPresence = function(methodName, expectedParameters, receivedParameters)
{
    if (expectedParameters.length < receivedParameters.length)
    {
        throw "got " + receivedParameters.length + " parameters for " + methodName + ", expected " + expectedParameters.length;
    }

    expectedParameters.forEach(function(exp, i)
    {
        //ensured to be a string
        if (typeof receivedParameters[i] == "undefined" || !receivedParameters[i].length)
        {
           throw "missing required parameter " + (i + 1) + " for " + methodName;
        }
    });
};

exports.processThenClause = function(thenClause, actors, simulateCall)
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

            var paramsOfAction = exports.processParamInput(actorCall[3]);

            extractedActorCalls.push({
                // actorCall[0] === ""
                actor: actorCall[1],
                method: actorCall[2],
                params: paramsOfAction,
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
            var result = "";
            var errorMessage = false;

            exports.validateParameterPresence(methodName, exposedMethods[methodName].params, parameters);

            if (!simulateCall)
            {
                errorMessage = exposedMethods[methodName].method.apply(this, parameters);
            }

            var isSuccessfull = !errorMessage;

            if (isSuccessfull)
            {
                result = simulateCall ? "Simulation succeeded." : "successfully executed";
            }
            else
            {
                throw new Error(errorMessage);
            }
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

    return exports.callResultsToString(callResults);
};

exports.callResultsToString = function(callResults)
{
    var returnValues = [];

    callResults.forEach(function(c)
    {
        returnValues.push(c.call + " -> " + c.result);
    });

    return returnValues.join(",");
};