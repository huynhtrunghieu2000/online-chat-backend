const SOCKET_EVENT = require("../constants/socket-event");
const { Message, User } = require("../db");

module.exports = (socket, io) => {
  const sendMessage = async (payload, callback) => {
    try {
      console.log("processin", payload);
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
            attributes: ["id", "full_name", "email", "avatar"],
          },
        ],
      });
      typeof callback === "function" && callback(newMessage);

      socket.broadcast
        .to(payload.idChannel)
        .emit(SOCKET_EVENT.CHANNEL.NEW_MESSAGE, newMessage);
    } catch (error) {
      // socket.emit(SOCKET_EVENT.MESSAGE.SEND_FAIL, "sent fail", err);
      typeof callback === "function" && callback({ error });
    }
  };

  const getMessage = (orderId, callback) => {
    // ...
  };

  socket.on(SOCKET_EVENT.MESSAGE.SEND, sendMessage);
  socket.on(SOCKET_EVENT.MESSAGE.GET, getMessage);
};
