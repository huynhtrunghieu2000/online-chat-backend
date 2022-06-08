require("dotenv").config();
const { ioSocketHandler } = require("./socket");
const express = require("express");
const https = require("httpolyglot");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");

const fs = require("fs");

const app = express();

const options = {
  key: fs.readFileSync("./config/ssl/key.pem", "utf-8"),
  cert: fs.readFileSync("./config/ssl/cert.pem", "utf-8"),
};
const server = https.createServer(options, app);
const io = new Server(server, {
  transports: ["websocket"],
  cors: {
    origin: [process.env.CLIENT_URL, "https://admin.socket.io"],
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

instrument(io, {
  auth: false,
});

// ioSocketHandler(io);

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public")); // folder to upload files

global.__basedir = __dirname; // very important to define base directory of the project. this is useful while creating upload scripts

// Routes
app.get("/", (req, res, next) => {
  try {
    res.json({
      status: "success",
      message: "Welcome 🙏",
    });
  } catch (err) {
    return next(err);
  }
});

const taskRoute = require("./routes/taskRoute");
const userRoute = require("./routes/userRoute");
const classroomRoute = require("./routes/classroomRoute");
const channelRoute = require("./routes/channelRoute");
app.use([taskRoute, userRoute, classroomRoute, channelRoute]); // you can add more routes in this array

//404 error
app.get("*", function (req, res) {
  res.status(404).json({
    message: "What?? 🙅",
  });
});

//An error handling middleware
app.use((err, req, res, next) => {
  console.log("🐞 Error Handler");

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    err: err,
  });
});

// Run the server
const port = process.env.PORT || 3000;
server.listen(3333, () =>
  console.log(`🐹 app listening on http://localhost:${port}`)
);
