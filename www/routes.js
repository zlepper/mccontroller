angular.module("server").config([
    "$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("dashboard");
        $stateProvider.state("dashboard", {
            url: "/dashboard",
            templateUrl: "/dashboard/dashboard.html",
            controller: "ServerController"
        })
            .state("setup", {
                url: "/setup",
                templateUrl: "/setup/setup.html",
                controller: "SetupController"
            })
            .state("config", {
                url: "/config",
                templateUrl: "/config/config.html",
                controller: "ConfigController"
            });
    }
]);
