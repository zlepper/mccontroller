angular.module("server").controller("ServerController", ["$scope", "socket", function ($scope, socket) {
    $scope.console = "";
    $scope.serverStatus = "offline";

    socket.on("send:consoleMessage", function (data) {
        $scope.console += data.message;
        document.getElementById("console").scrollTop = document.getElementById("console").scrollHeight
    });

    socket.on("serverStatus:set", function (data) {
        //console.log(data);
        $scope.serverStatus = data.status;
    });

    $scope.sendCommand = function () {
        socket.emit("send:consoleCommand", {
            command: $scope.consoleinput
        }, function (result) {
            if (!result) {
                alert("Something went wrong");
            } else {
                $scope.console += result;
                $scope.consoleinput = "";
            }
        });
    };

    $scope.shutdownServer = function () {
        socket.emit("function:shutdownServer", {}, function (result) {
            if (!result) {
                alert("Something went wront");
            } else {
                $scope.console += result;
            }
        });
    };

    $scope.startServer = function () {
        socket.emit("function:startupServer", {}, function (result) {
            if (!result) {
                alert("Something went wront");
            } else {
                $scope.console += result;
            }
        });
    };
}]);
