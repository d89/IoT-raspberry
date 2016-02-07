IoT.controller('IoTDashboardCtrl', function ($scope, $rootScope, $timeout, $compile, $routeParams, $location, constant, SocketFactory)
{
    //-----------------------------------------------------

    $rootScope.showLogout = true;

    $rootScope.sidebar =
    {
        "Sensor Data":
        [{
            title: "Dashboard",
            href: "#dashboard/" + $routeParams.client_id,
            active: true
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
            title: "Maintenance",
            href: "#maintenance/" + $routeParams.client_id
        }],
        "Device Overview":
        [{
            title: "Connected Devices",
            href: "#index"
        }]
    };

    //-----------------------------------------------------

    $scope.charts = {};
    $scope.stats = {};

    $scope.refreshData = function(type)
    {
        //console.log("refreshData for " + type);

        if (type in $scope.charts) {
            $scope.charts[type].destroy();
        }

        $("[data-chart-type='" + type + "'] .chart-wrapper").removeClass("block-opt-refresh");

        $scope.renderInitialChart(type, function()
        {
            //console.log("rendered " + type);

            $("[data-chart-type='" + type + "'] .chart-wrapper").removeClass("block-opt-refresh");
        });
    };

    $scope.renderInitialChart = function(type, cb)
    {
        SocketFactory.send("ui:full", { type: type }, function(dps)
        {
            var labels = [];
            var data = [];

            for (var i = dps.length - 1; i >= 0; i--)
            {
                var time = moment(dps[i].created).format('dd, HH:mm:ss');
                var dp = dps[i].data;

                labels.push(time);
                data.push(dp);
            }

            $scope.plot(type, labels, data);

            $scope.updateStatsForChart(type);

            if (cb) cb();
        });
    };

    $scope.plot = function(type, labels, data)
    {
        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var isSmall = windowWidth < 700;
        //alert(windowWidth);
        var container = $("[data-chart-type='" + type + "'] canvas");
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
            //because http://stackoverflow.com/questions/26498171/how-do-i-prevent-the-scale-labels-from-being-cut-off-in-chartjs
            scaleLabel: "<%= ' ' + value%>"
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

        if (datapoints.length)
        {
            $scope.stats[type].max = Math.max.apply(null, datapoints).toFixed(2);
            $scope.stats[type].min = Math.min.apply(null, datapoints).toFixed(2);
        }
        else
        {
            $scope.stats[type].max = 0;
            $scope.stats[type].min = 0;
        }

        $scope.stats[type].avg = avg.toFixed(2);
    };

    $scope.receivedData = function(msg, totalCount)
    {
        var type = msg.type;
        var data = msg.data;
        var time = moment(msg.created).format('dd, HH:mm:ss');

         if ($scope.charts[type])
         {
             $scope.charts[type].removeData();
             $scope.charts[type].addData([data], time);
         }

         $scope.updateStatsForChart(type);
    };

    //-----------------------------------------------------

    $scope.init = function()
    {
        $rootScope.hideStats = false;
        $rootScope.mainHeadline = "IoT Portal: Dashboard";
        $rootScope.subHeadline = "Displaying Live Data";

        $scope.connect(false, function()
        {
            SocketFactory.registerLifecycleCallback("dataupdate", $scope.receivedData);
        });
    };

    //-----------------------------------------------------

    $scope.init();
});