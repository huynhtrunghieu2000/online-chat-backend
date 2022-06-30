require("dotenv").config();
// Load model
const { Channel, Message, User, Attachment } = require("../db");
const { Op } = require("sequelize");

const utils = require("../utils");
const nodemailer = require("nodemailer");
var formidable = require("formidable");
var fs = require("fs");
const socketServer = require('../socket-handler/socketServer');
// Get All
module.exports.getAll = async (req, res, next) => {
  try {
    const channels = await Channel.findAll();
    res.json({
      status: "success",
      result: channels,
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Get One
module.exports.getOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    // const amount = await Message.count({
    //   where: {
    //     ChannelId: id
    //   }
    // });
    const channel = await Channel.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: Message,
          include: [
            {
              model: User,
              attributes: ["id", "full_name", "email", "avatar"],
            },
            {
              model: Attachment,
            },
          ],
          // order: [['createdAt', 'ASC']],
          // limit: 15,
          // offset: amount - 15
        },
      ],
    });
    res.json(channel);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Create
module.exports.create = async (req, res, next) => {
  try {
    const channel = req.body.channel; // id, name , type
    const classroomId = req.body.classroom_id;
    const record = await Channel.create({
      ...channel,
      ClassroomId: classroomId,
    });
    console.log(record.dataValues.id);
    socketServer.initConferenceNameSpaceRoom(record.dataValues.id)
    res.json(record);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Update
module.exports.update = async (req, res, next) => {
  try {
    const id = req.body.id;
    const channel = req.body;
    console.log(req.body);
    const record = await Channel.update(
      channel,
      {
        where: {
          id: {
            [Op.eq]: id,
          },
        },
      }
    );

    res.json(req.body);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Delete
module.exports.delete = async (req, res, next) => {
  try {
    const id = req.body.id;
    console.log(id)
    const deleted = await Channel.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });

    res.json(deleted);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Update Picture
module.exports.updatePicture = (req, res, next) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    const id = fields.id;

    if (!id) {
      var err = new Error("ID not found.");
      return next(err);
    } else {
      if (
        files.filetoupload.name &&
        !files.filetoupload.name.match(/\.(jpg|jpeg|png)$/i)
      ) {
        var err = new Error("Please select .jpg or .png file only");
        return next(err);
      } else if (files.filetoupload.size > 2097152) {
        var err = new Error("Please select file size < 2mb");
        return next(err);
      } else {
        var newFileName = utils.timestampFilename(files.filetoupload.name);

        var oldpath = files.filetoupload.path;
        var newpath = __basedir + "/public/uploads/pictures/" + newFileName;
        fs.rename(oldpath, newpath, function (err) {
          if (err) {
            return next(err);
          }

          Channel.update(
            {
              picture: newFileName,
            },
            {
              where: {
                id: {
                  [Op.eq]: id,
                },
              },
            }
          )
            .then((updated) => {
              res.json({
                status: "success",
                result: {
                  newFileName: newFileName,
                  affectedRows: updated,
                },
              });
            })
            .catch((err) => {
              return next(err);
            });
        });
      }
    }
  });
};

// Send email
module.exports.sendEmail = async (req, res, next) => {
  try {
    const id = req.body.id;
    const result = await Channel.findOne({
      where: {
        id: id,
      },
    });

    var transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_POST,
      auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASS,
      },
    });

    var mailOptions = {
      from: process.env.MAIL_FROM,
      to: "test@example.com",
      subject: "Test email",
      html: `Hi there! <br/><br/>
			This is just a test email from boilerplate code<br/><br/>
			Your channel is: ${result.channel}<br/><br/>
			Thank You.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      status: "success",
      result: result,
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
