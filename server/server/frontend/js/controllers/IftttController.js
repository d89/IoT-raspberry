IoT.controller('IoTIftttCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory)
{
    //-----------------------------------------------------

    $rootScope.showLogout = true;

    $rootScope.sidebar =
    {
        "Sensor Data":
        [{
            title: "Dashboard",
            href: "#dashboard/" + $routeParams.client_id
        },
        {
            title: "History",
            href: "#history/" + $routeParams.client_id
        }],
        "Actions":
        [{
            title: "Action",
            href: "#action/" + $routeParams.client_id
        },
        {
            title: "If This, Then That",
            href: "#ifttt/" + $routeParams.client_id,
            active: true
        },
        {
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id
        },
        {
            title: "Video",
            href: "#video/" + $routeParams.client_id
        },
        {
            title: "Audio",
            href: "#audio/" + $routeParams.client_id
        }],
        "Device Overview":
        [{
            title: "Connected Devices",
            href: "#index"
        }]
    };

    //-----------------------------------------------------

    $scope.addCondition = function()
    {
        var guid = function()
        {
            //http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };

        $scope.conditions.unshift({
            conditiontext: "if ($) { }",
            isActive: true,
            isNew: true, //used for frontend to focus cursor
            id: guid()
        });
    };

    $scope.removeCondition = function(cond)
    {
        for (var i = 0; i < $scope.conditions.length; i++)
        {
            if ($scope.conditions[i].id === cond.id)
            {
                $scope.conditions.splice(i, 1);
                return;
            }
        }
    };

    $scope.toggleCondition = function(cond)
    {
        console.log("toggle condition", cond);

        for (var i = 0; i < $scope.conditions.length; i++)
        {
            if ($scope.conditions[i].id === cond.id)
            {
                $scope.conditions[i].isActive = !$scope.conditions[i].isActive;
            }
        }
    };

    $scope.availableOptions = function()
    {
        //console.log("available options!");

        var ifttt = {
            mode: "availableoptions"
        };

        SocketFactory.send("ui:ifttt", ifttt, function(err, opts)
        {
            //console.log("got available options response", err, opts);

            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not load available options: " + err);
            }
            else
            {
                //console.log("options", opts);

                $scope.availableOptions = opts;

                setTimeout(function()
                {
                    $("#opts").removeClass("block-opt-refresh");
                }, 500);
            }
        });
    };

    $scope.conditionList = function()
    {
        //console.log("conditionlist!");

        var ifttt = {
            mode: "conditionlist"
        };

        SocketFactory.send("ui:ifttt", ifttt, function(err, resp)
        {
            //console.log("got conditionlist response", err, resp);

            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not load statements: " + err);
            }
            else
            {
                $scope.conditions = resp;

                setTimeout(function()
                {
                    $("#conds").removeClass("block-opt-refresh");
                }, 500);
            }
        });
    };

    $scope.testConditions = function()
    {
        $("#conds").addClass("block-opt-refresh");

        var conditions = {
            mode: "testconditions",
            testconditions: $scope.conditions
        };

        SocketFactory.send('ui:ifttt', conditions, function(err, testresults)
        {
            console.log("got testcondition response", err, testresults);

            setTimeout(function()
            {
                $("#conds").removeClass("block-opt-refresh");
            }, 500);

            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not test conditions: " + err);
                return;
            }

            $scope.onIftttUpdate(testresults, true);
        });
    };

    $scope.sendConditions = function()
    {
        $("#conds").addClass("block-opt-refresh");

        var conditions = {
            mode: "saveconditions",
            conditions: $scope.conditions
        };

        console.log("sending conditions", conditions);

        //unblock the test results
        $scope.blockForTest = false;

        SocketFactory.send('ui:ifttt', conditions, function(err, resp)
        {
            console.log("got saveconditions response", err, resp);

            setTimeout(function()
            {
                $("#conds").removeClass("block-opt-refresh");
            }, 500);

            if (err)
            {
                SocketFactory.callLifecycleCallback("functional_error", "Could not save statements: " + err);
            }
        });
    };

    $scope.onIftttUpdate = function(statementResultUpdate, blockForTest)
    {
        console.log("got statement update", statementResultUpdate);

        for (var id in statementResultUpdate)
        {
            var lastSuccessTime = statementResultUpdate[id].lastSuccessTime;

            if (lastSuccessTime)
            {
                if (!isNaN(lastSuccessTime))
                {
                    statementResultUpdate[id].lastSuccessTime = "Last success: " + moment(lastSuccessTime).format("HH:mm:ss (DD.MM.)");
                }
            }
            else
            {
                statementResultUpdate[id].lastSuccessTime = false;
            }

            var lastErrorTime = statementResultUpdate[id].lastErrorTime;

            if (lastErrorTime)
            {
                if (!isNaN(lastSuccessTime))
                {
                    statementResultUpdate[id].lastErrorTime = "Last Error: " + moment(lastErrorTime).format("HH:mm:ss (DD.MM.)");
                }
            }
            else
            {
                statementResultUpdate[id].lastErrorTime = false;
            }

            //class
            var state = statementResultUpdate[id].lastState;

            if (state === null)
            {
                statementResultUpdate[id].lastState = "info";
            }
            else if (state === false)
            {
                statementResultUpdate[id].lastState = "danger";
            }
            else
            {
                statementResultUpdate[id].lastState = "success";
            }

            if (!statementResultUpdate[id].lastMessage)
            {
                statementResultUpdate[id].lastMessage = "No message received yet";
            }
        }

        //block the current test result for 5 seconds, because otherwise it would be overridden straight away

        if (blockForTest)
        {
            $scope.blockForTest = (new Date).getTime() + 5000;
        }

        if (blockForTest || !$scope.blockForTest || $scope.blockForTest < (new Date).getTime())
        {
            $scope.conditionState = statementResultUpdate;
            $scope.$apply();
        }
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.mainHeadline = "IoT Portal: If This, Then That";
        $rootScope.subHeadline = "Define Conditions and Actions";

        $scope.connect(false, function()
        {
            $scope.availableOptions();
            $scope.conditionList();

            console.info("ifttt register iftttupdate!");
            SocketFactory.registerLifecycleCallback("iftttupdate", function(statementResultUpdate)
            {
                $scope.onIftttUpdate(statementResultUpdate);
            }, "ifttt");
        });
    };

    //-----------------------------------------------------

    $scope.init();
});

IoT.directive('tooltipActivate', function()
{
    return {
        restrict: 'A',
        link: function(scope, element, attrs)
        {
            //title is set by angular later, so fire as soon as the title is ready
            attrs.$observe('title', function(actual_value)
            {
                $(element).tooltip(scope.$eval({
                    container: 'body',
                    animation: false
                }));
            });
        }
    };
});

IoT.directive('iftttAutocomplete', function()
{
    return {
        restrict: 'A',
        link: function(scope, element, attrs)
        {
            attrs.$observe('readonly', function(isReadonly)
            {
                var e = $(element);
                if (isReadonly) return;
                var autotrigger = attrs.iftttAutocomplete === "true";
                Styles.initAutoComplete(e, scope.availableOptions, autotrigger);
            });
        }
    };
});