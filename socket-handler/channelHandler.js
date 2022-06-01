const SOCKET_EVENT = require("../constants/socket-event");
const { User, Channel } = require("../db");
const { Op } = require("sequelize");

module.exports = (socket, io, userId) => {
  const joinChannel = async (joinData, callback) => {
    try {
      const channelId = joinData;
      await User.update(
        {
          active_in_channel: channelId,
        },
        {
          where: {
            id: {
              [Op.eq]: userId,
            },
          },
        }
      );
      const channel = await Channel.findOne({
        where: {
          id: channelId,
        },
      });
      if(!userActiveInChannel[channelId]) {
        userActiveInChannel[channelId] = [];
        userActiveInChannel[channelId].push(userId);
      } else {
        userActiveInChannel[channelId].push(userId);
      }
      console.log("reload", channel);
      callback(channel.dataValues.ClassroomId);
      socket.broadcast.emit(
        "ChannelUserActiveChanged",
        channel.dataValues.ClassroomId
      );
    } catch (error) {
      socket.emit(SOCKET_EVENT.CHANNEL.JOIN_FAIL, "joined fail", error);
    }
  };

  const leaveChannel = async () => {
    try {
      await User.update(
        {
          active_in_channel: null,
        },
        {
          where: {
            id: {
              [Op.eq]: userId,
            },
          },
        }
      );
      socket.leave(channelId);
      io.to(channelId).emit("USER_LEAVE_CHANNEL", {
        user: userId,
        channel: channelId,
      });
    } catch (error) {
      socket.emit(SOCKET_EVENT.CHANNEL.LEAVE_FAIL, "left fail", error);
    }
  };
  socket.on(SOCKET_EVENT.CHANNEL.JOIN, joinChannel);
  socket.on("disconnect", leaveChannel);
};
