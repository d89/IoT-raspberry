'use strict';

var IoT = angular.module('IoT', [ 'ngRoute', 'IoTConstants' ]);

IoT.config(['$routeProvider', function($routeProvider)
{
    $routeProvider
        .when('/index', {
            templateUrl: 'templates/index/index.html',
            controller: 'IoTIndexCtrl'
        })
        .when('/error/:error_message', {
            templateUrl: 'templates/index/index.html',
            controller: 'IoTIndexCtrl'
        })
        .when('/maintenance/:client_id', {
            templateUrl: 'templates/maintenance/maintenance.html',
            controller: 'IoTMaintenanceCtrl'
        })
        .when('/history/:client_id', {
            templateUrl: 'templates/history/history.html',
            controller: 'IoTHistoryCtrl'
        })
        .when('/action/:client_id', {
            templateUrl: 'templates/action/action.html',
            controller: 'IoTActionCtrl'
        })
        .when('/dashboard/:client_id', {
            templateUrl: 'templates/dashboard/dashboard.html',
            controller: 'IoTDashboardCtrl'
        })
        .otherwise({
            redirectTo: '/index'
        });
}]);