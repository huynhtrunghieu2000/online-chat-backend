const SOCKET_EVENT = require('../constants/socket-event');
const { User, Channel, Message } = require('../db');
const { Op } = require('sequelize');

module.exports = (socket, io, userId) => {
  const socketServer = require('./socketServer');

  const joinChannel = async (joinData, callback) => {
    try {
      const channelId = joinData;
      const channel = await Channel.findOne({
        where: {
          id: channelId,
        },
      });
      socket.join(channelId);
      socketServer.joinChannel(channelId, socket.id);
      socket.broadcast.to(payload.idChannel).emit('channel:userJoin');
    } catch (error) {
      console.error(error);
    }
  };

  const leaveChannel = async () => {
    try {
      const leaveFromChannel = socketServer._userConnected[socket.id]?.activeIn
      socket.leave(leaveFromChannel);
      socketServer.leaveCurrentChannel(socket.id);
      socket.broadcast.to(leaveFromChannel).emit('channel:userLeave', socketServer.getOnlineUserInRoom(1));
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (payload, callback) => {
    try {
      const record = await Message.create({
        ChannelId: payload.idChannel,
        UserId: payload.User.id,
        message: payload.message,
      });
      const newMessage = await Message.findOne({
        where: {
          id: record.dataValues.id,
        },
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email', 'avatar'],
          },
        ],
      });
      callback(newMessage);
      socket.broadcast.to(payload.idChannel).emit(SOCKET_EVENT.CHANNEL.NEW_MESSAGE, newMessage);
    } catch (error) {
      console.log(error);
      typeof callback === 'function' && callback(error);
    }
  };

  const getMessage = (orderId, callback) => {
    // ...
  };

  socket.on(SOCKET_EVENT.MESSAGE.SEND, sendMessage);
  socket.on(SOCKET_EVENT.MESSAGE.GET, getMessage);
  socket.on(SOCKET_EVENT.CHANNEL.JOIN, joinChannel);
  socket.on('disconnect', leaveChannel);
};