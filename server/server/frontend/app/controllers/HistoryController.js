IoT.controller('IoTHistoryCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant)
{
    //-----------------------------------------------------

    $scope.templateLoadCount = 0;

    $rootScope.$on('$includeContentLoaded', function()
    {
        if (++$scope.templateLoadCount >= 4)
        {
            Styles.init();
        }
    });

    $scope.handleDisconnect = function(isClientDisconnect)
    {
        var err = isClientDisconnect ? "disconnect-client" : "disconnect-server";

        $rootScope.$apply(function() {
            var loc = $location.path('/error/' + err);
            console.log("after error redir", loc);
        });
    };

    //-----------------------------------------------------

    $scope.historyType = false;

    $scope.history = function(type)
    {
        $scope.historyType = type;

        if (type in $scope.charts) {
            $scope.charts[type].destroy();
        }

        $scope.renderHistoryAggregation(type, function()
        {
            console.log("done loading history for " + type);
        });
    };

    //-----------------------------------------------------

    $scope.socket = null;
    $scope.clientMessages = 0;
    $scope.charts = {};
    $scope.stats = {};

    $scope.getChartTypes = function()
    {
        return constant("dataTypes");
    };

    $scope.chartsLoaded = function()
    {
        console.log("charts loaded!");
        $scope.history("lastHourByMinute");
    };

    $scope.refreshData = function(type)
    {
        console.log("refreshData for " + type);

        if (type in $scope.charts) {
            $scope.charts[type].destroy();
        }

        $scope.renderHistoryAggregation(type, function()
        {
            console.log("rendered " + type);

            $("[data-chart-type='" + type + "'] .chart-wrapper").removeClass("block-opt-refresh");
        });
    };

    $scope.renderHistoryAggregation = function(type, ondone)
    {
        $(".chart-wrapper").addClass("block-opt-refresh");

        var query = {};

        switch (type)
        {
            case "lastHourByMinute":
            {
                console.log("Last Hour by Minute");

                query = {
                    interval: [2, "minutes"],
                    start: moment().subtract(1, 'hour'),
                    end: moment(),
                    skipcache: true,
                    displayFormat: "HH:mm:ss"
                };

                break;
            }
            case "last24hByHour":
            {
                console.log("Last 24h by Hour");

                query = {
                    interval: [1, "hour"],
                    start: moment().subtract(24, 'hours').startOf('hour'),
                    end: moment().endOf('hour'),
                    skipcache: false,
                    displayFormat: "HH:mm"
                };

                break;
            }
            case "last48hByHour":
            {
                console.log("Last 48h by Hour");

                query = {
                    interval: [2, "hour"],
                    start: moment().subtract(48, 'hours').startOf('hour'),
                    end: moment().endOf('hour'),
                    skipcache: false,
                    displayFormat: "DD.MM. HH:mm"
                };

                break;
            }
            case "lastWeekByHour":
            {
                console.log("Last Week by Hour");

                query = {
                    interval: [6, "hours"],
                    start: moment().subtract(7, 'days').startOf('day'),
                    end: moment().startOf("hour"),
                    skipcache: false,
                    displayFormat: "DD.MM. HH:mm"
                };

                break;
            }
            case "lastMonthByDay":
            {
                console.log("Last Month By Day");

                query = {
                    interval: [1, "day"],
                    start: moment().subtract(30, 'days').startOf('day'),
                    end: moment().endOf("day"),
                    skipcache: false,
                    displayFormat: "DD.MM."
                };

                break;
            }
            case "lastYearByMonth":
            {
                console.log("Last Year By Month");

                query = {
                    interval: [1, "month"],
                    start: moment().subtract(1, 'year').startOf('year'),
                    end: moment().endOf("month"),
                    skipcache: false,
                    displayFormat: "DD.MM."
                };

                break;
            }
        }

        $scope.socket.emit("ui:aggregation", query, function(dps)
        {
            console.log("got it all", dps);

            constant("dataTypes").forEach(function(typeObject)
            {
                var type = typeObject.id;

                var datapointsForType = dps[type];
                var labels = [];
                var data = [];

                for (var k = 0; k < datapointsForType.length; k++)
                {
                    var aggregated = datapointsForType[k];

                    if (aggregated !== null)
                    {
                        var time = moment(aggregated.from).format(query.displayFormat) + " - " + moment(aggregated.to).format(query.displayFormat);

                        var dp = ("avg" in aggregated) ? aggregated.avg : aggregated.data;
                        labels.push(time);
                        data.push(dp);
                    }
                    else
                    {
                        labels.push("no data");
                        data.push(null);
                    }
                }

                $scope.plot(type, labels, data);

                $scope.updateStatsForChart(type);
            });

            return ondone();
        });
    };

    $scope.plot = function(type, labels, data)
    {
        //reset chart canvas
        var holder = $("[data-chart-type='" + type + "'] .chart-holder");
        holder.html("<canvas class='chart'></canvas>");

        //remove loading icon
        var container = $("[data-chart-type='" + type + "'] canvas");
        $("[data-chart-type='" + type + "'] .block-opt-refresh").removeClass("block-opt-refresh");

        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var isSmall = windowWidth < 500;
        var chartData = $scope.generateInitialChartData(labels, data)
        var ctx = container[0].getContext("2d");

        var options = {
            animation: false,
            scaleFontFamily: "'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            scaleFontColor: '#999',
            scaleFontStyle: '600',
            tooltipTitleFontFamily: "'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            tooltipCornerRadius: 3,
            maintainAspectRatio: false,
            responsive: true,
            showTooltips: isSmall ? false : true,
        };

        if (isSmall) {
            options.scaleFontSize = 8;
        }

        $scope.charts[type] = new Chart(ctx).Line(chartData, options);
    };

    $scope.generateInitialChartData = function(labels, data)
    {
        return {
            labels: labels,
            datasets: [
            {
                label: "IoT Graph",
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(151,187,205,1)",
                pointColor: "rgba(151,187,205,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: data
            }]
        };
    };

    $scope.getCount = function()
    {
        console.log("requesting count");

        $scope.count = "Loading count";

        $scope.socket.emit('ui:data-count', {}, function(err, resp)
        {
            if (err)
            {
                $scope.count = err;
            }
            else
            {
                $scope.count = resp;
            }

            $scope.$apply();
        });
    };

    $scope.connectToDevice = function(id)
    {
        if ($scope.socket)
        {
            $scope.socket.disconnect();
        }

        $scope.socket = io.connect(constant("serverUrl"), { query: "mode=ui&client=" + id });

        $scope.socket.on("connect", function()
        {
            console.log("connected!");
        });

        $scope.socket.on("client-disconnected", function(data)
        {
            $scope.handleDisconnect(true);
        });

        $scope.socket.on("disconnect", function()
        {
            $scope.handleDisconnect(false);
        });

        $scope.socket.on("progress", function(data)
        {
            console.log("onprogress " + data.progress);
        });


        $scope.socket.on("dataupdate", function(msg)
        {
            $scope.clientMessages++;
            $scope.$apply();
            //console.log("dataupdate", msg);
        });

        $scope.socket.emit('ui:get-socket-info', {}, function(err, resp)
        {
            if (err)
            {
                $scope.client_name = err;
            }
            else
            {
                $scope.clientName = resp.client_name;
                $scope.connectedAt = moment(new Date(resp.connected_at)).format("DD.MM. HH:mm:ss").toString();
            }

            $scope.$apply();
        });
    };

    $scope.updateStatsForChart = function(type)
    {
        if (!$scope.charts[type]) {
            return;
        }

        var datapoints = [];
        $scope.charts[type].datasets[0].points.forEach(function(dp)
        {
            var num = parseFloat(dp.value, 10);

            if (!isNaN(num))
            {
                datapoints.push(num);
            }
        });

        if (!$scope.stats[type]) {
            $scope.stats[type] = {
                count: datapoints.length - 1
            };
        }

        var avg = 0;

        if (datapoints.length)
        {
            var sum = datapoints.reduce(function(a, b) { return a + b; });
            avg = sum / datapoints.length;
        }

        $scope.stats[type].count++;
        $scope.stats[type].max = Math.max.apply(null, datapoints).toFixed(2);
        $scope.stats[type].min = Math.min.apply(null, datapoints).toFixed(2);
        $scope.stats[type].avg = avg.toFixed(2);
    };

    $scope.sidebar =
    {
        "Sensor Data":
        [{
            title: "Dashboard",
            href: "#dashboard/" + $routeParams.client_id
        },
        {
            title: "History",
            href: "#history/" + $routeParams.client_id,
            active: true
        }],
        "Actions":
        [{
            title: "Action",
            href: "#action/" + $routeParams.client_id
        },
        {
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id
        }],
        "Device Overview":
        [{
            title: "Connected Devices",
            href: "#index"
        }]
    };

    $scope.init = function()
    {
        $scope.connectToDevice($routeParams.client_id);
        $scope.getCount();
    };

    $scope.init();
});