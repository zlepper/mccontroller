/// <reference path="typings/node/node.d.ts"/>
"use strict";
// Get the needed modules 
var path = require("path");
var auth = require("http-auth");
var express = require("express");
var http = require("http");
var app = express();
var bodyParser = require("body-parser");
var io = null;
var routes = require("./routes/routes");
var fs = require("fs");
var confighandler = require("./handlers/configHandler");

try {
    var th = fs.readFileSync(path.resolve(__dirname, "users.htpasswd"));
} catch (err) {
    fs.writeFileSync(path.resolve(__dirname, "users.htpasswd"), "admin:password", {encoding: "utf8"});
}

var basic = auth.basic({
    realm: "mcserver",
    file: path.resolve(__dirname, "users.htpasswd")
});

app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(auth.connect(basic), express.static("www"));
app.use(auth.connect(basic), express.static("node_modules"));
app.use("/", auth.connect(basic), routes);

var cfg = confighandler.loadConfigObj();

var port = cfg.port ? cfg.port : 8080;
if(cfg.port != port) {
    cfg.port = port;
    confighandler.saveConfig();
}

var server = require("http").Server(app);
var serverController = require("./bin/serverController");

// Start the application on port 8080
server.listen(port, function () {
    console.log("Application is now listening in port " + port);
    io = require("socket.io")(server);
    var setup = require("./bin/setup")(io);
    serverController.init(io);
});