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

var basic = auth.basic({
	realm: "mcserver",
	file: path.resolve(__dirname, "users.htpasswd")
});

app.use(auth.connect(basic));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (request, responce) {
	responce.sendFile(path.resolve("www", "index.html"));
});

app.get("/dashboard", function (request, responce) {
	responce.sendFile(path.resolve("www", "dashboard", "dashboard.html"));
});

// Map the menu template to the "/menu" path
app.get("/menu", function (request, responce) {
	responce.sendFile(path.resolve("www", "menu.html"));
});

app.get("/setup", function (request, responce) {
	responce.sendFile(path.resolve("www", "setup", "setup.html"));
});

app.get("/config", function (request, responce) {
	responce.sendFile(path.resolve("www", "config", "config.html"));
});

// Map the index.js file to the "/index.js" path
app.get("/index.js", function (request, responce) {
	responce.sendFile(path.resolve("www", "index.js"));
});

app.get("/angular", function (request, responce) {
	responce.sendFile(path.resolve("www", "lib", "angular.js"));
});

app.get("/angular.min.js.map", function (req, res) {
	res.sendFile(path.resolve("www", "lib", "angular.min.js.map"));
});

app.get("/angular-route", function (request, responce) {
	responce.sendFile(path.resolve("www", "lib", "angular-route.js"));
});

app.get("/angular-route.min.js.map", function (req, res) {
	res.sendFile(path.resolve("www", "lib", "angular-route.min.js.map"));
});

app.get("/angular-animate", function (req, res) {
	res.sendFile(path.resolve("www", "lib", "angular-animate.js"));
});

app.get("/ui-bootstrap", function(req, res){
	res.sendFile(path.resolve("www", "lib", "ui-bootstrap-tpls-0.13.0.js"));
});

app.get("/forgedata", function (request, response) {
	http.get("http://files.minecraftforge.net/maven/net/minecraftforge/forge/json", function (res) {
		res.pipe(response);
	});
});

// Map the stylesheet to the "/style.css" path
app.get("/style.css", function (request, responce) {
	responce.sendFile(path.resolve("www", "style.css"));
});

var server = require("http").Server(app);
var serverController = require("./serverController");

// Start the application on port 8080
server.listen("8080", function () {
	console.log("Application is now listening in port 8080");
	io = require("socket.io")(server);
	var setup = require("./setup")(io);
	serverController.init(io);
});