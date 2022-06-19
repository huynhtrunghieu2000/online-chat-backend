const { Server } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');
const { ioSocketHandler } = require('./socket');
const registerMediaSoupHandlers = require('./mediasoup');

class SocketServer {
  // private _conferenceSocket: Socket;
  constructor() {}

  get socketServer() {
    return this._socketServer;
  }

  addConnectedUser(id, info) {
    console.log(info, id);
    this._userConnected[id] = info;
  }

  removeConnectedUser(id) {
    delete this._userConnected[id];
  }

  joinRoom(id) {}

  initConferenceNameSpaceRoom(id) {
    registerMediaSoupHandlers(this._socketServer, id);
  }
  // get Socket() {
  //   return this.socket;
  // }

  // get conferenceSocket() {
  //   return this._conferenceSocket;
  // }
}

module.exports = {
  _socketServer: 1,
  _userConnected: {},
  _rooms: {},
  _channel: {},
  init(server) {
    this._socketServer = new Server(server, {
      transports: ['websocket'],
      cors: {
        origin: [process.env.CLIENT_URL, 'https://admin.socket.io'],
        methods: ['GET', 'POST'],
        transports: ['websocket', 'polling'],
        credentials: true,
      },
      allowEIO3: true,
    });
    // this._socketServer = io;
    console.log('initialSocket');
    instrument(this._socketServer, {
      auth: false,
    });

    ioSocketHandler(this._socketServer);
  },
  // User
  addConnectedUser(id, info) {
    this._userConnected[id] = info;
    console.log(this._userConnected);
  },

  removeConnectedUser(socketId) {
    delete this._userConnected[socketId];
  },
  // Room > Channel
  getOnlineUserInRoom(roomId) {
    const channelList = Object.keys(this._rooms[roomId]);
    return channelList.map((channelId) => this._rooms[roomId][channelId]);
  },
  joinRoom(roomId, socketId) {
    // this._rooms[roomId] = {
    //   ...this._rooms[roomId],
    //   [socketId]: this._userConnected[socketId],
    // };
  },
  leaveRoom(roomId, socketId) {
    // delete this._rooms[roomId][socketId]
  },

  joinChannel(channelId, socketId) {
    console.log(this._channel, socketId);
    if (this._userConnected[socketId]?.activeIn) {
      delete this._channel[this._userConnected[socketId].activeIn][socketId];
    }
    this._userConnected[socketId].activeIn = channelId;
    if (!this._channel[channelId]) this._channel[channelId] = {};
    this._channel[channelId][socketId] = this._userConnected[socketId];
  },

  leaveCurrentChannel(socketId) {
    delete this._channel[this._userConnected[socketId]?.activeIn][socketId];
    delete this._userConnected[socketId].activeIn;
  },

  initConferenceNameSpaceRoom: function (id) {
    registerMediaSoupHandlers(this._socketServer, id);
  },
};
