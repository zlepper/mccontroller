/// <reference path="typings/node/node.d.ts"/>
"use strict";
// Get the needed modules 
var path = require("path");
var auth = require("http-auth");
var express = require("express");
var http = require("http");
var app = express();
var apiApp = express();
var bodyParser = require("body-parser");
var io = null;
var routes = require("./routes/routes");

var basic = auth.basic({
    realm: "mcserver",
    file: path.resolve(__dirname, "users.htpasswd")
});

app.use(auth.connect(basic));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("www"));
app.use(express.static("node_modules"));

routes(app);

var server = require("http").Server(app);
var apiServer = require("http").Server(apiApp);
var serverController = require("./bin/serverController");

// Start the application on port 8080
server.listen("8080", function () {
    console.log("Application is now listening in port 8080");
    io = require("socket.io")(server);
    var setup = require("./bin/setup")(io);
    serverController.init(io);
});

apiServer.listen(8081, function () {
    console.log("API is now listening in port 8081");
});