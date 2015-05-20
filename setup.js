/// <reference path="typings/node/node.d.ts"/>
var socket = null;
var http = require("http");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var config = require("./configHandler");

function installForge(data) {
    var dir = path.resolve(__dirname, "server", "forge");
    mkdirp(dir, function (err) {
        if (err) {
            return;
        }
        var f = path.resolve(dir, "forge-" + data.forgeVersion + "-installer.jar");
        var file = fs.createWriteStream(f);
        console.log(data.forgeUrl);
        emit("installationStatus:downloadStarting", null);
        http.get(data.forgeUrl, function (response) {
            var length = parseInt(response.headers["content-length"]);
            var current = 0;
            var progress = 0;
            response.on("data", function (chunk) {
                current += chunk.length;
                var newProgress = Math.floor(current / length * 100);
                if (progress != newProgress) {
                    progress = newProgress;
                    emit("installationStatus:download", progress);
                }
            });

            response.on("end", function () {
                emit("installationStatus:downloadComplete", null);
                installForgeInstall(f);
            });

            response.on("error", function (error) {
                emit("installationStatus:error", error);
            });
            response.pipe(file);
        })
    });
}

function installForgeInstall(forge) {
    var serverDir = path.resolve(__dirname, "server");
    var options = {
        cwd: serverDir
    };
    var spawn = require("child_process").spawn;
    emit("installationStatus:installStarting", null);
    var listener = spawn("java", ["-jar", forge, "--installServer"], options);
    listener.stdout.on("data", function (data) {
        emit("installationStatus:stdout", data);
        var sdata = String(data);
        if (sdata.indexOf("server installed successfully") > -1) {
            console.log("FOUND!!!!!");
            var filename = sdata.slice(sdata.lastIndexOf(" ") + 1).trim();
            console.log(filename);
            var configObject = config.getConfigObject();
            configObject.executable = filename;
            config.saveConfigObject();
        }
    });

    listener.stderr.on("data", function (data) {
        console.log("stderr: " + data);
        emit("installationStatus:stderr", data);
    });

    listener.on("close", function (code) {
        console.log("Installation finished with code" + code);
        if (code == 0) {
            emit("installationStatus:success", null);
            console.log(forge);

        } else {
            emit("installationStatus:error", code);
        }
    });
}

function updateForgeConfig() {

}

function emit(event, data) {
    var sdata = String(data);
    if (data) console.log(sdata);
    if (socket != null) {
        socket.emit(event, sdata);
        socket.broadcast.emit(event, sdata);
    }
}

module.exports = function (i) {
    io = i;

    io.on("connection", function (s) {
        socket = s;

        s.on("setup:installForge", function (data) {
            installForge(data);
        });
    })
};