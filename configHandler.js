/// <reference path="typings/node/node.d.ts"/>
var fs = require("fs");
var path = require("path");

var config = null;

function readConfig() {
	var file = fs.readFileSync(path.resolve(__dirname, "config.json"), {encoding: "utf8"});
	config = JSON.parse(file);
}

function saveConfig(data) {
	//config = data;
	fs.writeFile(path.resolve(__dirname, "config.json"), JSON.stringify(config), function(err, data) {
		if(err) {
			console.log("Something went wront!!");
		}
	});
}

exports.getConfigObject = function() {
	console.log(config !== null);
	if(config !== null) {
		console.log(config);
		return config;
	} else {
		readConfig();
		return config;
	}
};

exports.saveConfigObject = saveConfig;

exports.reloadConfigFile = readConfig;