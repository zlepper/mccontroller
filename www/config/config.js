var log;

angular.module("server").controller("ConfigController", ["$scope", "$http", function ($scope, $http) {
    $scope.explorer = null;
    $scope.fileDetails = null;
    $scope.filePath = null;
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
        $scope.filePath = path;
        $http.post("/loadfile", {path: path})
            .success(function (data) {
                console.log(data);
                $scope.fileDetails = data;
            });
    };
    log = $scope;
    $scope.log = function (v) {
        console.log(v);
    };
}]);