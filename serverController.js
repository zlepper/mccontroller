/// <reference path="typings/node/node.d.ts"/>

var listener = null;
var io = null;
var socket = null;
var lastMessages = [];
var config = require("./configHandler");
var serverStatus = "offline";

/**
 * Call this function to start the local minecraft server
 */
function startServer() {
  var path = require('path');
  var serverDir = path.resolve(__dirname, "server");

  var options = {
    cwd: serverDir
  };
  var spawn = require('child_process').spawn;
  var configObject = config.getConfigObject();
  
  listener = spawn('java', ["-Xmx" + configObject.maxMemory + "M", "-Xms" + configObject.minMemory + "M", "-jar", configObject.executeable, "nogui"], options);
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
};

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
    emit("send:consoleMessage", { message: message });
  }
}

exports.init = function (i) {
  io = i;

  io.on("connection", function (s) {
    socket = s;
    lastMessages.forEach(function (message) {
      socket.emit("send:consoleMessage", { message: message });
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
    
    setServerStatus(serverStatus);
  });
};