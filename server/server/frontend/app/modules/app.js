'use strict';

var IoT = angular.module('IoT', [ 'ngRoute', 'IoTConstants' ]);

IoT.config(['$routeProvider', function($routeProvider)
{
    $routeProvider
        .when('/index', {
            templateUrl: 'templates/index/index.html'
        })
        .when('/error/:error_message', {
            templateUrl: 'templates/index/index.html'
        })
        .when('/maintenance/:client_id', {
            templateUrl: 'templates/maintenance/maintenance.html'
        })
        .when('/history/:client_id', {
            templateUrl: 'templates/history/history.html'
        })
        .when('/action/:client_id', {
            templateUrl: 'templates/action/action.html'
        })
        .when('/dashboard/:client_id', {
            templateUrl: 'templates/dashboard/dashboard.html'
        })
        .otherwise({
            redirectTo: '/index'
        });
}]);