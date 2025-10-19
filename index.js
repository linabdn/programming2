//most of the original code was kept intact. comments only where modifications were made or parts added

const express = require("express");
const socket = require("socket.io");

const PORT = 5000;
const app = express();
const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);

});

app.use(express.static("public"));

const io = socket(server);

const activeUsers = new Set();

io.on("connection", function (socket) {
  console.log("Made socket connection");

  socket.on("new user", function (data) {
    socket.userId = data;
    activeUsers.add(data);
    io.emit("new user", [...activeUsers]);
    //notifying all the other clients when a user joins
    socket.broadcast.emit("user joined", socket.userId); 
  });

  socket.on("disconnect", function () {
      activeUsers.delete(socket.userId);
      //notifying all clients when a user leaves
      io.emit("user disconnected", socket.userId);
    });

    socket.on("chat message", function (data) {
      io.emit("chat message", data);
  });

  //notifying all other clients when this user is typing
  socket.on("typing", function(username) {
    socket.broadcast.emit("typing", username);
  });

  //stopping the notification when the user stops typing or sent msg
  socket.on("stop typing", function(username) {
    socket.broadcast.emit("stop typing", username);
  });

});