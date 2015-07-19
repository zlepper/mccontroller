var path = require("path");
var http = require("http");
var dicer = require("../dicer/dicer");
var configuration = require("../bin/config");
var express = require("express");
var router = express.Router();

router.post("/technicPack", function (request, response) {
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

router.post("/solderInfo", function (request, response) {
    http.get(request.body.url, function (res) {
        res.pipe(response);
    })
});

router.post("/uploadMod", dicer);

router.get("/forgedata", function (request, response) {
    http.get("http://files.minecraftforge.net/maven/net/minecraftforge/forge/json", function (res) {
        res.pipe(response);
    });
});

router.get("/configfiles", configuration.findFiles);

router.post("/loadfile", configuration.loadFiles);

module.exports = router;