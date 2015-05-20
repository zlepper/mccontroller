/// <reference path="../typings/angularjs/angular.d.ts"/>
"use strict";

String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};
function isNullOrWhitespace(input) {

    if (typeof input === 'undefined' || input == null) return true;

    return input.replace(/\s/g, '').length < 1;
}

var io = io("http://localhost:8080");

var app = angular.module("server", ["ngRoute", "ngAnimate", "ui.bootstrap"]);
app.directive("menuBar", function () {
	return {
		restrict: "E",
		templateUrl: "/menu",
		controller: "routeController"
	};
});

app.controller("routeController", ["$scope", "$route", function ($scope, $route) {
	$scope.$route = $route;
}]);

app.controller("ServerController", ["$scope", "socket", function ($scope, socket) {
	$scope.console = "";
	$scope.serverStatus = "offline";

	socket.on("send:consoleMessage", function (data) {
		$scope.console += data.message;
	});

	socket.on("serverStatus:set", function (data) {
		console.log(data);
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
var log = null;
app.controller("SetupController", ["$scope", "socket", "$http", function ($scope, socket, $http) {
	$scope.forge = null;
    $scope.downloadProgress = 0;
    $scope.downloading = false;
	$scope.forgeversions = null;
	$scope.forgeversion = null;
	$scope.selectedMC = null;
	$scope.installing = false;
	$scope.installationMessages = [];

	log = function() {
		console.log($scope);
	};

	$http.get("/forgedata").success(function (data, status, headers, config) {
		for (var key in data.number) {
			var forgeVersion = data.number[key];
			if (forgeVersion.build < 879 || forgeVersion.mcversion == "1.7.10_pre4") {
				continue;
			}
			var downloadUrl = "{0}{1}-{2}{3}/forge-{1}-{2}{3}-installer.jar".format(data.webpath, forgeVersion.mcversion, forgeVersion.version, isNullOrWhitespace(forgeVersion.branch) ? "" : "-" + forgeVersion.branch);
			//console.log()
			if(!$scope.forge) $scope.forge = {};
			if($scope.forge[forgeVersion.mcversion] == undefined)
				$scope.forge[forgeVersion.mcversion] = {};
			$scope.forge[forgeVersion.mcversion][forgeVersion.version] = downloadUrl;
		}
		console.log("Done");
		console.log($scope.forge);
	});
	
	$scope.installForge = function() {
		console.log($scope);
		var url = $scope.selectedMC[$scope.forgeversion];
		console.log(url);
		var f = {
			forgeVersion: $scope.forgeversion,
			forgeUrl: url
		};
		console.log(f);
		socket.emit("setup:installForge", f);
	};

    socket.on("installationStatus:downloadStarting", function() {
        $scope.downloading = true;
    });

    socket.on("installationStatus:download", function(data) {
        $scope.downloadProgress = data;
    });

    socket.on("installationStatus:downloadComplete", function () {
		setTimeout(function() {
			console.log("Here");
			$scope.downloading = false;
			$scope.downloadProgress = 0;
			$scope.$apply();
		}, 1000);
    });

    socket.on("installationStatus:error", function(data) {
        console.log(data);
    });

	socket.on("installationStatus:installStarting", function() {
		$scope.installing = true;
	});

	socket.on("installationStatus:stdout", function(data) {
		if(isNullOrWhitespace(data)) return;
		console.log(data);
		$scope.installationMessages.push(data);
		$scope.installationMessages = $scope.installationMessages.slice(-6);
	});

	socket.on("installationStatus:success", function() {
		setTimeout(function() {
			$scope.installing = false;
			$scope.$apply();
		}, 3000);
	});
}]);

app.controller("ConfigController", ["$scope", function ($scope) {

}]);

app.factory('socket', function ($rootScope) {
	var socket = io.connect();
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
});

app.config([
	"$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
		$routeProvider.when("/dashboard", {
			templateUrl: "/dashboard",
			controller: "ServerController",
			controllerAs: "server",
			activetab: "dashboard"
		})
			.when("/setup", {
			templateUrl: "/setup",
			controller: "SetupController",
			controllerAs: "setup",
			activetab: "setup"
		})
			.when("/config", {
			templateUrl: "/config",
			controller: "ConfigController",
			activetab: "config"
		})
			.otherwise({ redirectTo: "/dashboard" });
	}
]);