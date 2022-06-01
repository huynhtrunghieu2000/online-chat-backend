const SOCKET_EVENT = {
  CONNECTION: {
    CONNECT: "connection",
    CONNECT_SUCCESS: "connect_success",
    CONNECT_FAIL: "connect_fail",
    DISCONNECT: "disconnect",
    ERROR: "error",
  },
  MESSAGE: {
    SEND: "message-send",
    SEND_SUCCESS: "message:send:success",
    SEND_FAIL: "message:send:fail",
    GET: "message:get",
  },
  CHANNEL: {
    JOIN: "channel:join",
    JOIN_SUCCESS: "channel:join:success",
    JOIN_FAIL: "channel:join:fail",
    LEAVE: "channel:leave",
    LEAVE_SUCCESS: "channel:leave:success",
    LEAVE_FAIL: "channel:leave:fail",
    NEW_MESSAGE: "channel:new:message",
  },
  VIDEO_CHAT: {},
};

module.exports = SOCKET_EVENT;
