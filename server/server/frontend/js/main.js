var backendUrl = 'https://d1303.de:3000';
var types = ["temperature", "cputemp", "humidity", "light", "soundvol", "sound", "movement1", "movement2"];
var charts = {};
var socket = null;
var isLive = true;

function getClients(cb)
{
    $.get("/clients/get", function(clients)
    {
        cb(JSON.parse(clients));
    });
}

function trimTo(arr, num)
{
    return arr.slice(Math.max(-1 * num, -1 * arr.length));
}

function startStream()
{
    $("#startstream").hide();
    $("#stopstream").show();

    $("#stream").attr("src", "http://www.airport-nuernberg.de/assets/webcam/webcam-big-loading.gif");
    $("#streamtime").html("Loading ...");
    $('#streamcontainer').show();

    socket.emit('ui:start-stop-stream', {
        start: true
    });
}

function stopStream()
{
    socket.emit('ui:start-stop-stream', {
        start: false
    });

    $("#startstream").show();
    $("#stopstream").hide();

    $('#streamcontainer').hide();
}

function shutdown()
{
    socket.emit("ui:maintenance", { mode: "shutdown" });
}

function restart()
{
    socket.emit("ui:maintenance", { mode: "restart" });
}

function generateInitialChartData(labels, data)
{
    return 	{
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
}

function plot(type, labels, data)
{
    var container = document.getElementById("chart-" + type);
    var chartData = generateInitialChartData(labels, data)
    var ctx = container.getContext("2d");
    charts[type] = new Chart(ctx).Line(chartData, { animation: false, responsive: true });
}

function renderInitialChart(type, cb)
{
    socket.emit("ui:full", { type: type }, function(dps)
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

        plot(type, labels, data);

        if (cb) cb();
    });
}

function renderHistoryAggregation(query, ondone)
{
    isLive = false;

    socket.emit("ui:aggregation", query, function(dps)
    {
        resetUi(true);

        console.log("got it all", dps);

        for (var i = 0; i < types.length; i++)
        {
            console.log("processing " + i);

            var type = types[i];

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

            console.log("plotting " + i);
            plot(type, labels, data);
        }

        return ondone();
    });
}

function sendAction(type, transferObject)
{
    var action = {
        type: type,
        data: transferObject
    };

    console.log("emitting action to client", action);

    socket.emit("ui:action", action);
}

function getCount(cb)
{
    console.log("requesting count");

    socket.emit('ui:data-count', {}, function(err, resp)
    {
        if (err)
            return cb(err);

        return cb(resp);
    });
}

function resetUi(noSpinner)
{
    $("#actionarea").css("visibility", "visible");
    $("#dataarea").html("").show();

    types.forEach(function(type)
    {
        if (type in charts) {
            charts[type].destroy();
        }

        charts = {};

        var loadingClass = noSpinner ? "" : "loading";
        $("#dataarea")[0].innerHTML += "<h2>" + type + "<div class='chartholder " + loadingClass + "'><canvas id='chart-" + type + "' class='chart'></canvas></div>";
    });
}

function startLiveMode()
{
    //TODO waitingDialog.show("Preparing live mode");

    isLive = true;

    resetUi();

    var loaded = 0;

    types.forEach(function(type)
    {
        renderInitialChart(type, function()
        {
            ++loaded;

            //TODO waitingDialog.show("Preparing live mode: " + loaded + " ready");

            $("#chart-" + type).parents(".chartholder").removeClass("loading");

            if (types.length === loaded)
            {
                setTimeout(function()
                {
                    waitingDialog.hide();
                }, 200);
            }
        });
    });
}

function connectToDevice(id)
{
    if (socket)
    {
        socket.disconnect();
    }

    socket = io.connect(backendUrl, { query: "mode=ui&client=" + id });

    socket.on("connect", function()
    {
        startLiveMode();
    });

    getCount(function(cnt)
    {
        $("#count p").text(cnt);
        $("#refresh-count").show();
    });

    socket.on("client-disconnected", function(data)
    {
        alert("client " + data.id + " disconnected!");
        window.location.reload();
    });

    socket.on("progress", function(data)
    {
        waitingDialog.show("Data aggregation pending: Query " + data.progress, {dialogSize: 'sm' });
    });

    socket.on("disconnect", function()
    {
        alert("server disconnected!");
        window.location.reload();
    });

    socket.on("cam-stream", function(msg)
    {
        var image = msg.image;
        var date = msg.date;

        $('#stream').attr('src', 'data:image/jpg;base64,' + image);
        $('#streamtime').html("Now: " + moment().format("HH:mm:ss") + "<br />" + "Img: " + moment(date).format("HH:mm:ss"));
    });

    socket.on("dataupdate", function(msg)
    {
        if (!isLive)
        {
            return;
        }

        //console.log("received", msg);

        var type = msg.type;
        var data = msg.data;
        var time = moment(msg.created).format('dd, HH:mm:ss');

        if (charts[type])
        {
            charts[type].removeData();
            charts[type].addData([data], time);
        }
    });
}

$(document).ready(function()
{
    $("#refresh-count").on("click", function()
    {
        $("#refresh-count").hide();
        $("#count p").text("Loading ...");

        getCount(function(cnt)
        {
            $("#count p").text(cnt);
            $("#refresh-count").show();
        });
    });

    $("#connectedClients").on("click", "a", function()
    {
        var id = $(this).attr("data-id");
        connectToDevice(id);
    });

    $("#actionarea").on("click", "input.send", function()
    {
        var type = $(this).parents("div.action").attr("id");
        var transferObject = {};

        if (type === "led")
        {
            var ledType = $("#led select").val();
            transferObject.ledType = ledType;
        }
        else if (type === "switchrc")
        {
            var switchNumber = $("#switchrc select").val();
            var onoff = $("#switchrc input[name=switchrconoff]:checked").val();

            transferObject.switchNumber = switchNumber;
            transferObject.onoff = onoff;
        }

        sendAction(type, transferObject);
    });

    $("#sendAggregation").on("click", function()
    {
        try
        {
            var options = JSON.parse($("#aggregation-conf textarea").val());
            options.start = eval(options.start);
            options.end = eval(options.end);
        }
        catch (err)
        {
            alert(err);
            return;
        }

        console.log("agg config", options);

        waitingDialog.show("Data aggregation pending");

        renderHistoryAggregation(options, function()
        {
            waitingDialog.hide();
        });
    });

    $("a#actionLive").on("click", function()
    {
        $("#aggregation-conf").hide();

        $("a.actionAggregation").removeClass("active");
        $(this).addClass("active");
        startLiveMode();
    });

    $("a.actionAggregation").on("click", function()
    {
        var presets = {
            lasthour : '{\n' +
            '   "interval": [5, "minute"],\n' +
            '   "start": "moment().subtract(1, \'hour\')",\n' +
            '   "end": "moment()",\n' +
            '   "skipcache": true,\n' +
            '   "displayFormat": "HH:mm:ss"\n' +
            '}',
            daysofmonth: '{\n' +
            '   "interval": [1, "day"],\n' +
            '   "start": "moment().subtract(30, \'days\').startOf(\'day\')",\n' +
            '   "end": "moment()",\n' +
            '   "skipcache": false,\n' +
            '   "displayFormat": "DD.MM."\n' +
            '}',
            hoursofday: '{\n' +
            '   "interval": [1, "hour"],\n' +
            '   "start": "moment().subtract(24, \'hours\').startOf(\'hour\')",\n' +
            '   "end": "moment()",\n' +
            '   "skipcache": false,\n' +
            '   "displayFormat": "HH:mm"\n' +
            '}',
        };

        var preset = $(this).attr("data-preset");
        $("a#actionLive, a.actionAggregation").removeClass("active");
        $("a.actionAggregation[data-preset=" + preset + "]").addClass("active");

        var selectedPreset = presets[preset];
        $("#aggregation-conf textarea").val(selectedPreset);

        $("#aggregation-conf").show();
    });

    getClients(function(clients)
    {
        $("#connectedClients").append("<h2>Number of connected clients: " + clients.length + "</h2><ul>");

        for (var i = 0; i < clients.length; i++)
        {
            var clientHtml = "<li>" +
                "<a data-id='" + clients[i].id + "' class='connectedClient'>" +
                "<b>" + clients[i].client_name + "</b> " +
                "</a>(" + clients[i].id + " @ " + clients[i].address +
                ", last @ " + moment(clients[i].connected_at).format("DD.MM. HH:mm:ss") + ")"
            "</li>"

            $("#connectedClients").append(clientHtml);
        }

        $("#connectedClients").append("</ul>");
    });
});