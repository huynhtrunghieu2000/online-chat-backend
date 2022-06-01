const mediasoup = require("mediasoup");

const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {
      "x-google-start-bitrate": 1000,
    },
  },
];

module.exports = class MediaSoupWorker {
  static _instance;

  constructor() {
    if (MediaSoupWorker._instance) {
      return MediaSoupWorker._instance;
    }
    this._rooms = {};
    this._peers = {};
    this._transports = [];
    this._producers = [];
    this._consumers = [];
    this._worker = null;
    this.createWorker().then((worker) => {
      this._worker = worker;
    });
  }

  get worker() {
    return this._worker;
  }

  set worker(worker) {
    this._worker = worker;
  }

  get rooms() {
    return this._rooms;
  }

  set rooms(rooms) {
    this._rooms = rooms;
  }

  get peers() {
    return this._peers;
  }

  set peers(peers) {
    this._peers = peers;
  }

  get transports() {
    return this._transports;
  }

  set transports(transports) {
    this._transports = transports;
  }

  set producers(producers) {
    this._producers = producers;
  }

  get producers() {
    return this._producers;
  }

  set consumers(consumers) {
    this._consumers = consumers;
  }

  get consumers() {
    return this._consumers;
  }

  static getInstance() {
    if (!MediaSoupWorker._instance) {
      MediaSoupWorker._instance = new MediaSoupWorker();
    }
    return MediaSoupWorker._instance;
  }

  createWorker = async () => {
    const worker = await mediasoup.createWorker({
      rtcMinPort: 2000,
      rtcMaxPort: 2020,
    });
    console.log(`worker pid ${worker.pid}`);

    worker.on("died", (error) => {
      // This implies something serious happened, so kill the application
      console.error("mediasoup worker has died");
      setTimeout(() => process.exit(1), 2000); // exit in 2 seconds
    });

    return worker;
  };
};
