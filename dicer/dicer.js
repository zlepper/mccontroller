var dicer = require("dicer");
var inspect = require('util').inspect;
var RE_BOUNDARY = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
var path = require("path");
var fs = require("fs");

module.exports = function (request, response) {
    var m;
    var pa = path.resolve("server", "mods");
    if (request.headers["content-type"] && (m = RE_BOUNDARY.exec(request.headers["content-type"]))) {
        fs.mkdir(pa, function (err) {
            if (err) {
                if (err.code != "EEXIST")
                    console.log(err);
            }
            var d = new dicer({boundary: m[1] || m[2]});

            d.on('part', function (p) {
                console.log('New part!');
                p.on('header', function (header) {
                    for (var h in header) {
                        console.log('Part header: k: ' + inspect(h)
                            + ', v: ' + inspect(header[h]));
                    }
                    var filenameString = header["content-disposition"][0].match(/filename=".+"/)[0];
                    var filename = filenameString.replace("filename=", "").replace(/"/g, "");
                    console.log(filename);
                    var f = path.resolve(pa, filename);
                    var file = fs.createWriteStream(f);
                    file.on("error", function (err) {
                        console.log(err);
                    });
                    p.pipe(file);
                });
                p.on('data', function (data) {
                    //console.log('Part data: ' + inspect(data.toString()));
                });
                p.on('end', function () {
                    console.log('End of part\n');
                });
            });
            d.on('finish', function () {
                console.log('End of parts');
                response.writeHead(200);
                response.end('Form submission successful!');
            });
            request.pipe(d);
        });
    }
};