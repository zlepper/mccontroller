var fileSearcher = require("./fileSearcher");
var path = require("path");
var fs = require("fs");
exports.findFiles = function (req, res) {
    var p = path.resolve(__dirname, "..", "server", "config");
    res.send(fileSearcher(p));
};

exports.loadFiles = function (req, res) {
    console.log(req.body.path);

    res.send(readConfigFile(req.body.path));
};

function readConfigFile(p) {
    var configPath = path.resolve(__dirname, "..", "server", "config", p);
    console.log(configPath);
    var data = fs.readFileSync(configPath, "utf8");
    //console.log(data);
    if (p.indexOf(".cfg") != -1) {
        return parseAsCfg(data);
    } else if (p.indexOf(".conf") != -1) {
        return parseAsConf(data);
    }
}

function parseAsConf(data) {
    var configObj = {type: "conf"};
    var lines = data.replace(/\r/g, "").split("\n");
    var inCat = false;
    var category = "";
    var comment = "";
    lines.forEach(function (line) {
        line = line.trim();
        if (line != "") {
            if (line.indexOf("##") != -1) {
                // We are in either the start of the end of a category definition
                inCat = !inCat;
            } else if (inCat) {
                category = line.replace(/#/g, "").trim();
            } else if (line.indexOf("#") == 0) {
                comment = line;
            } else {
                // We should be at a value
                var l = line.split("=");
                var prop = l[0];
                var v = l[1];
                if (v != "") {
                    if (v == "false" || v == "true") {
                        v = Boolean(v);
                    } else {
                        if (!isNaN(Number(v))) {
                            v = Number(v);
                        }
                    }
                }
                var value = {comment: comment, value: v};
                if (configObj[category] == null) configObj[category] = {};
                configObj[category][prop] = value;
                comment = "";
            }
        }
    });
    return configObj;
}

function parseAsCfg(data) {
    var configObj = {type: "cfg"};
    var lines = data.replace(/\r/g, "").split("\n");
    var comment = "";
    var category = "";
    var inList = false;
    var l;
    var prop;
    var value;
    var cats;
    var obj;
    var i;
    lines.forEach(function (line) {
        line = line.trim();
        if (line != "") {
            if (line.indexOf("#") == 0) {
                // This is a comment
                comment += line;
            } else {
                if (inList) {
                    if (line.indexOf(">") == -1) {
                        obj[prop].value.push(line);
                    } else {
                        //obj[prop].value = obj[prop].value.join("\n");
                        //console.log(obj[prop].value);
                        inList = false;
                        obj = null;
                    }

                } else if (line.indexOf(":") == 1) {
                    //This is an actual config option
                    if (line.indexOf("B:") == 0) {
                        // This is a boolean
                        l = line.split(":");
                        l = l[1].split("=");
                        prop = l[0];
                        value = {comment: comment, value: Boolean(l[1])};
                        obj = null;

                        if (category.indexOf("/") == -1) {
                            // We are in a toplevel category
                            if (configObj[category] == null) {
                                configObj[category] = {};
                            }
                            configObj[category][prop] = value;
                        } else {
                            // We are in some deep trouble
                            cats = category.split("/");
                            for (i = 0; i < cats.length; i++) {
                                if (i == 0) {
                                    if (configObj[cats[i]] == null) {
                                        configObj[cats[i]] = {};
                                    }
                                    obj = configObj[cats[i]];
                                } else {
                                    if (obj[cats[i]] == null) {
                                        obj[cats[i]] = {};
                                    }
                                    obj = obj[cats[i]];
                                }
                            }
                            obj[prop] = value;
                        }
                    } else if (line.indexOf("<") != -1) {
                        // We are in a list
                        inList = true;
                        l = line.split(":");
                        prop = l[1].replace(/</g, "").trim();
                        value = {comment: comment, value: []};
                        obj = null;
                        if (category.indexOf("/") == -1) {
                            // We are in a toplevel category
                            if (configObj[category] == null) {
                                configObj[category] = {};
                            }
                            configObj[category][prop] = value;
                            obj = configObj[category];
                        } else {
                            // We are in some deep trouble
                            cats = category.split("/");
                            for (i = 0; i < cats.length; i++) {
                                if (i == 0) {
                                    if (configObj[cats[i]] == null) {
                                        configObj[cats[i]] = {};
                                    }
                                    obj = configObj[cats[i]];
                                } else {
                                    if (obj[cats[i]] == null) {
                                        obj[cats[i]] = {};
                                    }
                                    obj = obj[cats[i]];
                                }
                            }
                            obj[prop] = value;
                        }

                    } else if (line.indexOf("I:") == 0 || line.indexOf("D:") == 0) {
                        // This is a number
                        l = line.split(":");
                        l = l[1].split("=");
                        prop = l[0];
                        value = {comment: comment, value: Number(l[1])};

                        obj = null;
                        if (category.indexOf("/") == -1) {
                            // We are in a toplevel category
                            if (configObj[category] == null) {
                                configObj[category] = {};
                            }
                            configObj[category][prop] = value;
                        } else {
                            // We are in some deep trouble
                            cats = category.split("/");
                            for (i = 0; i < cats.length; i++) {
                                if (i == 0) {
                                    if (configObj[cats[i]] == null) {
                                        configObj[cats[i]] = {};
                                    }
                                    obj = configObj[cats[i]];
                                } else {
                                    if (obj[cats[i]] == null) {
                                        obj[cats[i]] = {};
                                    }
                                    obj = obj[cats[i]];
                                }
                            }
                            obj[prop] = value;
                        }
                    } else if (line.indexOf("S:") == 0) {
                        // This is a string
                        l = line.split(":");
                        l = l[1].split("=");
                        prop = l[0];
                        value = {comment: comment, value: l[1]};

                        obj = null;
                        if (category.indexOf("/") == -1) {
                            // We are in a toplevel category
                            if (configObj[category] == null) {
                                configObj[category] = {};
                            }
                            configObj[category][prop] = value;
                        } else {
                            // We are in some deep trouble
                            cats = category.split("/");
                            for (i = 0; i < cats.length; i++) {
                                if (i == 0) {
                                    if (configObj[cats[i]] == null) {
                                        configObj[cats[i]] = {};
                                    }
                                    obj = configObj[cats[i]];
                                } else {
                                    if (obj[cats[i]] == null) {
                                        obj[cats[i]] = {};
                                    }
                                    obj = obj[cats[i]];
                                }
                            }
                            obj[prop] = value;
                        }
                    }
                } else {
                    // This should be a category tag
                    if (line == "}") {
                        if (category.lastIndexOf("/") == -1) {
                            // We are at the topmost category
                            category = "";
                        } else {
                            // We are in some deep trouble
                            category = category.substring(0, category.lastIndexOf("/"));
                        }
                    } else {
                        // Remove the { and any whitespace
                        line = line.replace(/\{/g, "").trim();
                        if (category == "") {
                            // We are currently in no category
                            category = line;
                        } else {
                            // We are going deeper
                            category = category + "/" + line;
                        }
                    }
                }
            }
        } else {
            comment = "";
        }
    });
    return configObj;
}