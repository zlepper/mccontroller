var path = require("path");
var fs = require("fs");
var root = path.dirname(require.main.filename);
var f = path.resolve(root, "server", "server.properties");

function readPropFile(callback) {
    var propObj = {};
    fs.readFile(f, {encoding: "utf8"}, function (err, data) {
        if (err) {
            if (err.code == "ENOENT") {
                return;
            }
            throw err;
        }
        var lines = data.replace(/\r/g, "").split("\n");
        lines.forEach(function (line) {
            if (line.indexOf("#") != 0) {
                if (line.indexOf("=") != -1) {
                    var props = line.split("=");
                    if (props.length == 2) {
                        // We need to put everything in an object for angular to like it.
                        var value = {
                                v: null
                            },
                            p = props[1];
                        if (isNaN(Number(p))) {
                            if (p == "true" || p == "false") {
                                value.v = p == "true";
                            } else if (p == "") {
                                value.v = "";
                            } else {
                                value.v = getString(p);
                            }

                        } else {
                            if (p !== "") {
                                value.v = Number(p)
                            } else {
                                value.v = getString(p);
                            }
                        }
                        if (value.v != null) {
                            propObj[props[0]] = value;
                        }
                    } else {
                        console.log(props + ":" + line);
                    }
                }
            }
        });
        callback(propObj);
    });
}

function isStringUppercase(s) {
    if (s.length == 0) return false;
    for (var i = 0; i < s.length; i++) {
        if (s.charAt(i) !== s.toUpperCase().charAt(i)) {
            return false;
        }
    }
    return true;
}

function getString(s) {
    var value = null;
    if (isStringUppercase(s)) {
        value = {
            value: s,
            isUppercase: true
        }
    } else {
        value = {
            value: s,
            isUppercase: false
        }
    }
    return value;
}

function savePropFile(data) {
    if (typeof(data) == "string") data = JSON.parse(data);
    var s = "";
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var obj = data[key];
            s += key + "=";
            if (typeof(obj.v) == "object") {
                if (obj.v.isUppercase) {
                    s += obj.v.value.toUpperCase();
                } else {
                    s += obj.v.value;
                }
            } else {
                s += obj.v;
            }
            s += "\r\n";
        }
    }
    fs.writeFile(f, s, function (err) {
        if (err) throw err;
        console.log("Saved");
    })
}

exports.readFile = readPropFile;
exports.saveFile = savePropFile;