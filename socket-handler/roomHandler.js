const SOCKET_EVENT = require('../constants/socket-event');
const { User, Channel, Message, Attachment } = require('../db');
const { Op } = require('sequelize');
const attachmentQuery = require('../query/attachment');
module.exports = (socket, io, userId) => {
  const socketServer = require('./socketServer');

  const joinChannel = async (joinData, callback) => {
    try {
      const channelId = joinData;
      console.log('🚀 ~ file: roomHandler.js ~ line 11 ~ joinChannel ~ channelId', channelId);
      const channel = await Channel.findOne({
        where: {
          id: channelId,
        },
      });
      socket.join(String(channelId));
      socketServer.joinChannel(String(channelId), socket.id);
      socket.broadcast.to(String(channelId)).emit('channel:userJoin');
      callback();
    } catch (error) {
      console.error(error);
    }
  };

  const leaveChannel = async () => {
    try {
      const leaveFromChannel = socketServer._userConnected[socket.id]?.activeIn;
      socket.leave(leaveFromChannel);
      socketServer.leaveCurrentChannel(socket.id);
      socket.broadcast.to(leaveFromChannel).emit('channel:userLeave', socketServer.getOnlineUserInRoom(1));
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (payload, callback) => {
    try {
      console.log(payload);
      const record = await Message.create({
        ChannelId: payload.idChannel,
        UserId: payload.User.id,
        message: payload.message.message,
      });
      console.log('message created', record);
      const attachments = payload.message.attachments;
      if (attachments?.length)
        await Promise.all(
          attachments.map((attachment) => attachmentQuery.addAttachment(attachment, record.dataValues.id))
        );
      const newMessage = await Message.findOne({
        where: {
          id: record.dataValues.id,
        },
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email', 'avatar'],
          },
          {
            model: Attachment,
          },
        ],
      });
      io.of('/').to(String(payload.idChannel)).emit(SOCKET_EVENT.CHANNEL.NEW_MESSAGE, newMessage);
      callback(newMessage);
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
  socket.on('disconnect', leaveChannel);
};
