/// <reference path="typings/node/node.d.ts"/>
var socket = null;
var http = require("./webget");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var config = require("./../handlers/configHandler");
var yauzl = require("yauzl");
var crypto = require('crypto');
var ifh = require("./../handlers/improvedFileHandler");
var propParser = require("./../handlers/propertiesParser");

function installForge(data) {
    var dir = path.resolve("server", "forge");
    mkdirp(dir, function (err) {
        if (err) {
            return;
        }
        var f = path.resolve(dir, "forge-" + data.forgeVersion + "-installer.jar");
        var file = fs.createWriteStream(f);
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
    var serverDir = path.resolve("server");
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
            var filename = sdata.slice(sdata.lastIndexOf(" ") + 1).trim();
            var configObject = config.loadConfigObj();
            configObject.executable = filename;
            config.saveConfig();
        }
    });

    listener.stderr.on("data", function (data) {
        emit("installationStatus:stderr", data);
    });

    listener.on("close", function (code) {
        if (code == 0) {
            emit("installationStatus:success", null);
        } else {
            emit("installationStatus:error", code);
        }
    });
}

function emit(event, data) {
    var sdata = String(data);
    //if (data) console.log(sdata);
    if (socket != null) {
        socket.emit(event, sdata);
        socket.broadcast.emit(event, sdata);
    }
}

function installSolderPack(buildUrl) {
    emit("modpackInstallationStatus:starting", true);
    http.get(buildUrl, function (res) {
        var body = "";
        res.on("data", function (chunk) {
            body += chunk;
        });
        res.on("end", function () {
            installMods(JSON.parse(body).mods);
        });
    });
}

function installMods(mods) {
    var dir = path.resolve("server", "cache");
    mkdirp(dir, function (err) {
            if (err) {
                console.log(err);
                return;
            }
            emit("modpackInstallationStatus:totalMods", mods.length);
            installMod(mods, mods.length);
        }
    );
}

function installMod(mods, length) {
    var mod = mods.shift();
    var m = {
        text: mod.name + " version " + mod.version,
        number: length - mods.length + 1
    };
    emit("modpackInstallationStatus:downloadingMod", JSON.stringify(m));
    var f = path.resolve("server", "cache", mod.name + "-" + mod.version + ".zip");
    gethash(f, function (md5) {
        if (md5 && md5 == mod.md5) {
            unzipFile(f, path.resolve("server"));
            if (mods.length > 0) {
                installMod(mods, length);
            } else {
                emit("modpackInstallationStatus:downloadComplete", null)
            }
            return;
        }
        var file = fs.createWriteStream(f);
        http.get(mod.url, function (res) {
            var len = parseInt(res.headers["content-length"]);
            var current = 0;
            var progress = 0;
            res.pipe(file);
            res.on("data", function (chunk) {
                current += chunk.length;
                var newProgress = Math.floor(current / len * 100);
                if (progress != newProgress) {
                    progress = newProgress;
                    emit("modpackInstallationStatus:downloadProgressed", progress);
                }
            });

            res.on("end", function () {
                emit("modpackInstallationStatus:modDownloadComplete", null);
                file.end();
                unzipFile(f, path.resolve("server"));
                if (mods.length > 0) {
                    installMod(mods, length);
                } else {
                    emit("modpackInstallationStatus:downloadComplete", null)
                }
            });

            res.on("error", function (error) {
                emit("modpackInstallationStatus:error", error);
            });
        });
    });
}

function unzipFile(zippath, outputfolder) {
    yauzl.open(zippath, function (err, zipfile) {
        if (err) throw err;
        zipfile.on("entry", function (entry) {
            // If the found entry is a directory return
            if (/\/$/.test(entry.fileName)) {
                // directory file names end with '/'
                return;
            }
            zipfile.openReadStream(entry, function (err, readStream) {
                if (err) throw err;
                // ensure parent directory exists, and then:
                var outputfile = path.resolve(outputfolder, entry.fileName);
                var dirname = path.dirname(outputfile);
                mkdirp(dirname, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    readStream.pipe(fs.createWriteStream(outputfile));
                });
            });
        });
    });
}

function gethash(filepath, callback) {
    var fd = fs.createReadStream(filepath);
    var hash = crypto.createHash("md5");

    fd.on("data", function (chunk) {
        hash.update(chunk);
    });

    fd.on("end", function () {
        var h = hash.digest("hex");
        callback(String(h));
    });

    fd.on("error", function (err) {
        callback(null);
    });
}

function installTechnicPack(data) {
    http.get(data.url, function (res) {
        var f = path.resolve("server", "cache", data.modpackname + ".zip");
        var file = fs.createWriteStream(f);
        emit("modpackInstallationStatus:totalMods", 100);
        emit("modpackInstallationStatus:starting", false);
        var len = parseInt(res.headers["content-length"]);
        var current = 0;
        var progress = 0;
        res.pipe(file);
        res.on("data", function (chunk) {
            current += chunk.length;
            var newProgress = Math.round(current / len * 100 * 10) / 10;
            if (progress != newProgress) {
                progress = newProgress;
                emit("modpackInstallationStatus:downloadingMod", JSON.stringify({number: progress}));
            }
        });

        res.on("end", function () {
            file.end();
            emit("modpackInstallationStatus:downloadComplete", null)
            unzipFile(f, path.resolve("server"));
        });

        res.on("error", function (error) {
            console.log(error);
            emit("modpackInstallationStatus:error", error);
        });
    });
}

function prepareServerDir() {
    ifh.rmdirSync(path.resolve("server", "mods"));
    ifh.rmdirSync(path.resolve("server", "config"));
    ifh.rmdirSync(path.resolve("server", "scripts"));
}

function downloadAndInstallMod(data) {
    // Save the mod so it's installed each time
    var configObj = config.loadConfigObj();
    if (!configObj.customMods) {
        configObj.customMods = [];
    }
    configObj.customMods.push(data);

    http.get(data.url, function (res) {
        var file = path.resolve("server", "mods", data.name + "-" + data.version + ".jar");
        var f = fs.createWriteStream(file);
        emit("setup:installingMod", JSON.stringify({name: data.name + "-" + data.version}));
        res.on("end", function () {
            f.end();
            emit("setup:installationFinished", JSON.stringify({name: data.name + "-" + data.version}));
        });
        res.pipe(f);
    });
}

module.exports = function (i) {
    io = i;

    io.on("connection", function (s) {
        socket = s;

        s.on("setup:installForge", function (data) {
            installForge(data);
        });

        s.on("setup:installSolderPack", function (data) {
            prepareServerDir();
            installSolderPack(data.url);
            var configObj = config.loadConfigObj();
            configObj.installType = "solder";
            configObj.install = data;
            config.saveConfig();
        });

        s.on("setup:installTechnicPack", function (data) {
            prepareServerDir();
            installTechnicPack(data);
            var configObj = config.loadConfigObj();
            configObj.installType = "technic";
            configObj.install = data;
            config.saveConfig();
        });

        s.on("get:serverProperties", function () {
            propParser.readFile(function (properties) {
                socket.emit("respond:serverProperties", JSON.stringify(properties));
            });
        });

        s.on("post:serverProperties", function (data) {
            propParser.saveFile(data);
        });

        s.on("setup:installCustomMod", function (data) {
            downloadAndInstallMod(JSON.parse(data));
        });
    })
};