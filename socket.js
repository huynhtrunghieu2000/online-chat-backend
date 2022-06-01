require("dotenv").config();
const jwt = require("jsonwebtoken");

const registerMessageHandlers = require("./socket-handler/messageHandler");
const registerChannelHandlers = require("./socket-handler/channelHandler");
const registerMediaSoupHandlers = require("./socket-handler/mediasoup");
function onConnection(socket, io) {
  console.log("💻 Socket connected");
  socket.emit("test");
  socket.on("disconnect", () => console.log("💻 Socket disconnected ❌"));

  let userID = "";
  if (socket.handshake.auth.token) {
    jwt.verify(
      socket.handshake.auth.token,
      process.env.AUTH_SECRET,
      (err, decoded) => {
        if (err) {
          socket.disconnect();
        } else {
          userID = decoded.id;
          console.log("💻 Socket connected with token", userID);
        }
      }
    );
  }

  registerMessageHandlers(socket, io, userID);
  registerChannelHandlers(socket, io, userID);
  // registerMediaSoupHandlers(socket);
  socket.use(([event, ...args], next) => {
    console.log(`received ${event}`, ...args);
    next();
  });
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`emitted ${event}`, args);
  });
}

const ioSocketHandler = (io) => {
  io.on("connection", (socket) => onConnection(socket, io));
  io.engine.on("connect_error", (err) => {
    console.log("error");
  });
  registerMediaSoupHandlers(io);
};
module.exports = { ioSocketHandler };
