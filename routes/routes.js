var path = require("path");
var http = require("http");
var dicer = require("../dicer/dicer");
var configuration = require("../bin/config");

module.exports = function (app) {
    app.post("/technicPack", function (request, response) {
        http.get("http://api.technicpack.net/launcher/version/stable", function (res) {
            var body = "";
            res.on("data", function (chunk) {
                body += chunk;
            });
            res.on("end", function () {
                var technicResponse = JSON.parse(body);
                http.get(request.body.url + "?build=" + technicResponse.build, function (r) {
                    r.pipe(response);
                });
            });
        }).on("error", function (e) {
            console.log(e);
        });
    });

    app.post("/solderInfo", function (request, response) {
        http.get(request.body.url, function (res) {
            res.pipe(response);
        })
    });

    app.post("/uploadMod", dicer);

    app.get("/forgedata", function (request, response) {
        http.get("http://files.minecraftforge.net/maven/net/minecraftforge/forge/json", function (res) {
            res.pipe(response);
        });
    });

    app.get("/configfiles", configuration.findFiles);

    app.post("/loadfile", configuration.loadFiles);

    // app.post("/uploadMod", multipartyMiddleware, fileController.uploadFile);
};