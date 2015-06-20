/// <reference path="typings/node/node.d.ts"/>
(function () {
    var configObj, configPath, fs, path;

    configObj = null;

    fs = require("fs");

    path = require("path");

    configPath = path.resolve(__dirname, "config.json");

    exports.loadConfigObj = function () {
        var data, e;
        if (configObj != null) {
            return configObj;
        } else {
            try {
                data = fs.readFileSync(configPath);
                configObj = JSON.parse(data.toString());
                return configObj;
            } catch (_error) {
                e = _error;
                if (e.code !== "ENOENT") {
                    console.log(e);
                    throw e;
                } else {
                    return configObj = {};
                }
            }
        }
    };

    exports.saveConfig = function () {
        if (configObj != null) {
            return fs.writeFile(configPath, JSON.stringify(configObj), function (err) {
                if (err != null) {
                    console.log(err);
                    throw err;
                } else {
                    return console.log("Config Saved");
                }
            });
        } else {
            return console.log("Nothing to save");
        }
    };

}).call(this);