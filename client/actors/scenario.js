"use strict";

var async = require('async');
var fs = require('fs');
var baseActor = require("./baseActor");
var actormanagement = require("../actormanagement");
var config = require("../config");
var SCENARIO_FILE = config.baseBath + "/scenarios.json";

// ######################################################

class scenario extends baseActor
{
    constructor(options)
    {
        super("scenario", options);
    }

    exposed()
    {
        return {
            execute: {
                method: this.execute.bind(this),
                params: [{
                    name: "name",
                    isOptional: false,
                    dataType: "string",
                    notes: "name of the scenario to execute."
                }]
            }
        };
    }

    loadScenarios(cb)
    {
        var that = this;

        if (!fs.existsSync(SCENARIO_FILE))
        {
            return cb([]);
        }

        fs.readFile(SCENARIO_FILE, function(err, file)
        {
            if (err)
            {
                file = [];
            }
            else
            {
                try {
                    file = JSON.parse(file);
                }
                catch (e) {
                    that.logger.error("could not parse " + SCENARIO_FILE + ": ", e);
                    file = [];
                }
            }

            return cb(file);
        });
    }

    deleteScenario(name, cb)
    {
        var that = this;
        name = name.toString().toLowerCase();
        that.logger.info("deleting scenario " + name);

        that.loadScenarios(function(scenarios)
        {
            var scenariosCleaned = [];
            var found = false;

            for (var i = 0; i < scenarios.length; i++)
            {
                var scenario = scenarios[i];

                if (scenario.name !== name)
                {
                    scenariosCleaned.push(scenario);
                }
                else
                {
                    found = true;
                }
            }

            if (!found)
            {
                return cb("scenario '" + name + "' not found");
            }

            try {
                var toSave = JSON.stringify(scenariosCleaned, null, 4);

                fs.writeFile(SCENARIO_FILE, toSave, function(err, msg)
                {
                    if (err)
                    {
                        return cb("could not delete scenarios");
                    }

                    return cb(null, scenariosCleaned);
                });

            } catch (e) {
                return cb(e);
            }
        });
    }

    execute(name, cb)
    {
        var that = this;

        cb = cb || function(err, resp)
        {
            that.logger.info("scenario result", err, resp);
        };

        name = name.toString().toLowerCase();

        that.logger.info("executing scenario " + name);

        that.loadScenarios(function(scenarios)
        {
            that.logger.info("loaded scenarios: " + scenarios.length, scenarios);

            var foundScenario = false;

            for (var i = 0; i < scenarios.length; i++)
            {
                var scenario = scenarios[i];

                if (scenario.name === name)
                {
                    foundScenario = scenario;
                    that.logger.info("scenario is", scenario);
                    break;
                }
            }

            if (!foundScenario)
            {
                return cb("scenario '" + name + "' not found");
            }

            that.logger.info("found scenario '" + name + "'");

            that.executeScenario(foundScenario, cb);
        });
    }

    executeScenario(foundScenario, cb)
    {
        var that = this;

        var actorCalls = [];

        foundScenario.actors.forEach(function(actor)
        {
            var isTimeout = "timeout" in actor;

            if (isTimeout)
            {
                actorCalls.push(function(cbActor)
                {
                    setTimeout(function()
                    {
                        cbActor(null, "waited " + actor.timeout + "ms");
                    }, actor.timeout);
                });
            }
            else
            {
                var actorname = actor.actor;
                var methodname = actor.method;
                var params = actor.params;

                actorCalls.push(function(cbActor)
                {
                    actormanagement.executeByName(actorname, methodname, params, function(err, ret)
                    {
                        //that.logger.info("executed " + actorname + " -> " + methodname, err, ret);
                        cbActor(err, ret);
                    });
                });
            }
        });

        async.series(actorCalls, function(err, data)
        {
            if (err)
            {
                return cb(err);
            }

            return cb(null, "Executed scenario '" + foundScenario.name + "' with individual results: " + data.join(" | "));
        });
    }

    save(scenarioItems, name, cb)
    {
        var that = this;

        name = name.toString().toLowerCase();

        that.logger.info("received scenarioItems", scenarioItems);

        that.loadScenarios(function(scenarios)
        {
            for (var i = 0; i < scenarios.length; i++)
            {
                if (scenarios[i].name === name)
                {
                    that.logger.info("found " + name + ", removing");
                    scenarios.splice(i, 1);
                    break;
                }
            }

            scenarios.push({
                name: name,
                actors: scenarioItems
            });

            try {
                scenarios = JSON.stringify(scenarios, null, 4);
            } catch (e) {
                return cb(e);
            }

            fs.writeFile(SCENARIO_FILE, scenarios, function(err, msg)
            {
                if (err)
                {
                    return cb("could not save scenarios");
                }

                return cb(null, "successfully saved scenario '" + name + "'");
            });
        });
    }
}

module.exports = scenario;