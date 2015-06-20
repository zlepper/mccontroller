angular.module("server").controller("directoryController", ["$scope", function ($scope) {
    $scope.typeof = function (type, value) {
        return typeof(value) == type;
    };
}]).directive("directory", function () {
    return {
        restrict: "E",
        templateUrl: "/config/directory.html",
        scope: {
            dir: "=dir"
        },
        controller: "directoryController"
    };
});
