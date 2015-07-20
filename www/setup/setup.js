angular.module("server").controller("SetupController", ["$scope", "socket", "$http", function ($scope, socket, $http) {
    $scope.forge = null;
    $scope.downloadProgress = 0;
    $scope.downloading = false;
    $scope.forgeversions = null;
    $scope.forgeversion = null;
    $scope.selectedMC = null;
    $scope.installing = false;
    $scope.installationMessages = [];
    $scope.technicPlatformUrl = null;
    $scope.platformPackInfo = null;
    $scope.installingPack = false;
    $scope.modpackDownloadProgress = 0;
    $scope.modDownloadProgress = 0;
    $scope.modname = null;
    $scope.downloadingSolderPack = false;
    $scope.totalMods = 100;
    $scope.properties = null;
    $scope.customModURL = null;
    /*$scope.memory = {
        min: 4096,
        max: 4096,
        permgen: 128
    };*/

    log = function () {
        console.log($scope);
    };

    $http.get("/forgedata").success(function (data, status, headers, config) {
        for (var key in data.number) {
            var forgeVersion = data.number[key];
            if (forgeVersion.build < 879 || forgeVersion.mcversion == "1.7.10_pre4") {
                continue;
            }
            var downloadUrl = "{0}{1}-{2}{3}/forge-{1}-{2}{3}-installer.jar".format(data.webpath, forgeVersion.mcversion, forgeVersion.version, isNullOrWhitespace(forgeVersion.branch) ? "" : "-" + forgeVersion.branch);
            if (!$scope.forge) $scope.forge = {};
            if ($scope.forge[forgeVersion.mcversion] == undefined)
                $scope.forge[forgeVersion.mcversion] = {};
            $scope.forge[forgeVersion.mcversion][forgeVersion.version] = downloadUrl;
        }
    });

    $scope.installForge = function () {
        var url = $scope.selectedMC[$scope.forgeversion];
        var f = {
            forgeVersion: $scope.forgeversion,
            forgeUrl: url
        };
        socket.emit("setup:installForge", f);
    };

    socket.on("installationStatus:downloadStarting", function () {
        $scope.downloading = true;
    });

    socket.on("installationStatus:download", function (data) {
        $scope.downloadProgress = data;
    });

    socket.on("installationStatus:downloadComplete", function () {
        setTimeout(function () {
            $scope.downloading = false;
            $scope.downloadProgress = 0;
            $scope.$apply();
        }, 1000);
    });

    socket.on("installationStatus:error", function (data) {
        console.log(data);
    });

    socket.on("installationStatus:installStarting", function () {
        $scope.installing = true;
    });

    socket.on("installationStatus:stdout", function (data) {
        if (isNullOrWhitespace(data)) return;
        $scope.installationMessages.push(data);
        $scope.installationMessages = $scope.installationMessages.slice(-6);
    });

    socket.on("installationStatus:success", function () {
        setTimeout(function () {
            $scope.installing = false;
            $scope.$apply();
        }, 3000);
    });

    $scope.$watch("technicPlatformUrl", function () {
        $scope.getPlatformInfo();
    });

    $scope.installSolderPack = function () {
        if (!$scope.selectedBuild) return;
        var packet = {
            url: $scope.platformPackInfo.slug + "/" + $scope.selectedBuild,
            name: $scope.platformPackInfo.displayName,
            minecraft: $scope.platformPackInfo.minecraft
        };
        socket.emit("setup:installSolderPack", packet);
    };

    socket.on("modpackInstallationStatus:starting", function (solderpack) {
        console.log(solderpack);
        $scope.installingPack = true;
        $scope.downloadingSolderPack = Boolean(solderpack);
    });

    socket.on("modpackInstallationStatus:totalMods", function (totalMods) {
        $scope.totalMods = totalMods;
    });

    socket.on("modpackInstallationStatus:downloadingMod", function (mod) {
        var m = JSON.parse(mod);
        console.log(m);
        if (m.text)
            $scope.modname = m.text;
        $scope.modpackDownloadProgress = m.number;
    });

    socket.on("modpackInstallationStatus:downloadProgressed", function (progress) {
        $scope.installingPack = true;
        $scope.modDownloadProgress = progress;
    });

    socket.on("modpackInstallationStatus:modDownloadComplete", function () {
        $scope.downloadingSolderPack = true;
        $scope.modDownloadProgress = 0;
    });

    socket.on("modpackInstallationStatus:downloadComplete", function () {
        setTimeout(function () {
            $scope.installingPack = false;
            $scope.$apply();
        }, 5000);
    });

    socket.on("modpackInstallationStatus:error", function (err) {
        alert(err);
    });

    $scope.installTechnicPack = function () {
        console.log("Called");
        socket.emit("setup:installTechnicPack", {
            url: $scope.platformPackInfo.url,
            name: $scope.platformPackInfo.name,
            minecraft: $scope.platformPackInfo.minecraft
        });
    };

    $scope.getPlatformInfo = function () {
        if (!$scope.technicPlatformUrl) return;
        var d = {
            url: $scope.technicPlatformUrl
        };
        $http.post("/technicPack", d).success(function (data) {
            $scope.platformPackInfo = data;
            if ($scope.platformPackInfo.solder) {
                $scope.platformPackInfo.slug = data.solder + "modpack/" + data.name;
                $http.post("/solderInfo", {url: $scope.platformPackInfo.slug}).success(function (dat) {
                    $scope.platformPackInfo.builds = dat.builds;
                });
            }
        });
    };

    $scope.refreshPropFile = function () {
        console.log("SOMETHING");
        socket.emit("get:serverProperties", null);
    };
    $scope.refreshPropFile();

    socket.on("respond:serverProperties", function (s) {
        $scope.properties = JSON.parse(s);
        console.log($scope.properties);
    });
    $scope.typeof = function (type, value) {
        return typeof(value) == type;
    };
    $scope.savePropFile = function () {
        console.log($scope.properties);
        socket.emit("post:serverProperties", JSON.stringify($scope.properties));
    };
    $scope.installCustomModFromUrl = function () {
        console.log($scope.customModURL);
        var o = {
            url: $scope.customModURL,
            name: $scope.customModName,
            version: $scope.customModVersion
        };
        socket.emit("setup:installCustomMod", JSON.stringify(o));
    };
    socket.on("setup:installingMod")

    $scope.saveMemory = function() {
        socket.emit("setup:setMemory", JSON.stringify($scope.memory));
    };
    socket.on("setup:setMemory", function(data) {
        console.log(data);
        $scope.memory = JSON.parse(data);
    })
}]);