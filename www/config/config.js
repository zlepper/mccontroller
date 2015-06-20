angular.module("server").controller("ConfigController", ["$scope", "$http", function ($scope, $http) {
    $scope.explorer = null;
    $http.get("/configfiles")
        .success(function (data, status, headers, config) {
            console.log(data);
            $scope.explorer = data;
        });

    $scope.typeof = function (type, value) {
        return typeof(value) == type;
    };

    $scope.loadFile = function (path) {
        console.log(path);
        $http.post("/loadfile", {path: path})
            .success(function (data) {
                console.log(data);
            });
    }
}]);