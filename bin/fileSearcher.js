var path = require("path");
var fs = require("fs");

module.exports = function (pathToSearch) {
    var obj = getFiles(pathToSearch);
    return JSON.stringify(obj);
};

function getFiles(p) {
    var files = fs.readdirSync(p);
    var obj = [];
    files.forEach(function (f) {
        var filepath = path.resolve(p, f);
        var stats = fs.statSync(filepath);
        if (stats.isFile()) {
            if (f.indexOf(".cfg") != -1 || f.indexOf(".conf") != -1)
                obj.push(f)
        } else if (stats.isDirectory()) {
            var o = {};
            o[f] = getFiles(filepath);
            obj.push(o);
        }
    });
    return obj;
}