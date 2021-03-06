/// <reference path="typings/node/node.d.ts"/>

var listener = null;
var io = null;
var socket = null;
var lastMessages = [];
var config = require("../handlers/configHandler");
var serverStatus = "offline";
var propparser = require("../handlers/propertiesParser");
var fs = require("fs");
var path = require("path");

/**
 * Call this function to start the local minecraft server
 */
function startServer() {
    var path = require('path');
    var serverDir = path.resolve("server");

    if (checkEula() == false) {
        emit("serverStatus:eulaNotAccepted");
        return;
    }

    var options = {
        cwd: serverDir
    };
    var spawn = require('child_process').spawn;
    var configObject = config.loadConfigObj();
    if(!configObject.executable) {
        sendMessageToClientConsole("You need to install forge from the setup tab first!");
        return;
    }
    var maxMemory = configObject.memory.max ? configObject.memory.max : 4096;
    var minMemory = configObject.memory.min ? configObject.memory.min : 4096;
    var permGen = configObject.memory.permgen ? configObject.memory.permgen : 128;

    listener = spawn('java', ["-Xmx" + maxMemory + "M", "-Xms" + minMemory + "M", "-XX:MaxPermSize=" + permGen + "M", "-jar", configObject.executable, "nogui"], options);
    listener.on("error", function (err) {
        console.log(err);
    });
    setServerStatus("online");
    listener.stdout.on('data', function (data) {
        sendMessageToClientConsole(data);
    });

    listener.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
        sendMessageToClientConsole(data);
    });

    listener.on('close', function (code) {
        console.log('child process exited with code ' + code);
        if (code == 0) {
            sendMessageToClientConsole("Server shutdown successful!!");
        } else {
            sendMessageToClientConsole("Server shutdown with code " + code);
        }
        listener = null;
        setServerStatus("offline");
    });
}

function checkEula() {
    var eula = "";
    try {
        eula = fs.readFileSync(path.resolve("server", "eula.txt"), {encoding: "utf8"});
    } catch (err) {
        return false;
    }
    var lines = eula.replace(/\r/g, "").split("\n");
    for(var i = 0; i < lines.length; i++) {
        if (lines[i] == "eula=true") {
            return true;
        }
    }
    return false;
}

function setServerStatus(status) {
    serverStatus = status;
    emit("serverStatus:set", {status: status});
}

/**
 * Call this to emit data to all connected clients with specified event
 */
function emit(event, data) {
    socket.emit(event, data);
    socket.broadcast.emit(event, data);
}

/**
 * Call this function to gracefully shutdown the server
 */
function stopServer() {
    sendCommand("stop");
}

function sendCommand(command) {
    if (listener !== null) {
        listener.stdin.write(command + "\n");
    }
}

function sendMessageToClientConsole(message) {
    message = String(message);
    lastMessages.push(message);
    lastMessages = lastMessages.slice(-50);
    if (socket != null) {
        emit("send:consoleMessage", {message: message});
    }
}

function acceptEula() {
    fs.writeFileSync(path.resolve("server", "eula.txt"), "eula=true", {encoding: "utf8"});
    startServer();
}
exports.init = function (i) {
    io = i;

    io.on("connection", function (s) {
        socket = s;
        lastMessages.forEach(function (message) {
            socket.emit("send:consoleMessage", {message: message});
        });

        s.on("send:consoleCommand", function (data) {
            sendCommand(data.command);
        });

        s.on("function:shutdownServer", function () {
            stopServer();
        });

        s.on("function:startupServer", function () {
            startServer();
        });

        s.on("eula:accepted", function() {
            acceptEula();
        });

        setServerStatus(serverStatus);
    });
};