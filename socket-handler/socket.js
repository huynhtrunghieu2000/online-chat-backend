require('dotenv').config();
const jwt = require('jsonwebtoken');

const { Channel } = require('../db');
const userQuery = require('../query/user');
// const registerMessageHandlers = require('./messageHandler');
const registerRoomHandlers = require('./roomHandler');

function onConnection(socket, io) {
  const socketServer = require('./socketServer');
  console.log('💻 Socket connected');
  socket.emit('test');
  socket.on('disconnect', () => {
    socketServer.removeConnectedUser(socket.id);
    console.log('💻 Socket disconnected ❌');
  });

  let userID = '';
  if (socket.handshake.auth.token) {
    jwt.verify(socket.handshake.auth.token, process.env.AUTH_SECRET, (err, decoded) => {
      if (err) {
        console.log('socket', err, decoded);
        socket.disconnect();
      } else {
        userID = decoded.id;
        console.log('💻 Socket connected with token', userID);
        socketServer.addConnectedUser(socket.id, decoded);
      }
    });
  }

  // const joinAllRoomNeeded = async (userId) => {
  //   const record = await userQuery.getUserByIdWithRoomJoined(userId);
  //   const ids = record.get({plain: true}).Classrooms.map((room) => room.id);
  //   console.log(ids);
  //   socket.join(ids);
  // };

  if (userID) {
    // registerMessageHandlers(socket, io, userID);
    // TODO: Xu ly cho room socket ni truoc
    registerRoomHandlers(socket, io, userID);
    // joinAllRoomNeeded(userID);
  }

  socket.use(([event, ...args], next) => {
    console.log(`received ${event}`, ...args);
    next();
  });
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`emitted ${event}`, args);
  });
}

const ioSocketHandler = (io) => {
  const socketServer = require('./socketServer');
  io.on('connection', (socket) => onConnection(socket, io));
  io.engine.on('connect_error', (err) => {
    console.log('error');
  });
  Channel.findAll({
    where: {
      type: 'video',
    },
    attributes: ['id'],
  }).then((channels) => {
    const ids = channels.map((channel) => channel.dataValues.id);
    ids.map((id) => socketServer.initConferenceNameSpaceRoom(id));
  });
};
module.exports = { ioSocketHandler };
