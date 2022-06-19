require('dotenv').config();
// Load model
const { Event } = require('../db');
const { Op } = require('sequelize');

const utils = require('../utils');
const nodemailer = require('nodemailer');
var formidable = require('formidable');
var fs = require('fs');
const jwt = require("jsonwebtoken");

const eventQuery = require('../query/event');
const createHttpError = require('http-errors');

// Get All
// module.exports.getAll = async (req, res, next) => {
//   try {
//     const { id, is_admin } = jwt.decode(
//       req.headers.authorization.split(" ")[1]
//     );
//     const tasks = await Event.findAll();
//     res.json(tasks);
//   } catch (err) {
//     return next(err);
//   }
// };

module.exports.getAllByUserId = async (req, res, next) => {
  try {
    const { id, is_admin } = jwt.decode(
      req.headers.authorization.split(" ")[1]
    );
    const tasks = await eventQuery.getEventsByUserId(id);
    res.json(tasks);
  } catch (err) {
    return next(err);
  }
};

// Get One
module.exports.getOne = async (req, res, next) => {
  try {
    const id = req.params.event_id;
    if (!id) throw new createHttpError.BadRequest('Missing event_id');
    const event = await eventQuery.getEventById(id);
    if (!event) throw new createHttpError.NotFound('Event not found');
    res.json(event);
  } catch (err) {
    return next(err);
  }
};

// Create
module.exports.create = async (req, res, next) => {
  try {
    const { id, is_admin } = jwt.decode(
      req.headers.authorization.split(" ")[1]
    );
    const event = {...req.body, user_id: id};
    console.log(event)
    const record = await eventQuery.createNewEvent(event);
    if (!record) throw new createHttpError.InternalServerError('Something wrong');
    res.json(record);
  } catch (err) {
    return next(err);
  }
};

// Update
module.exports.update = async (req, res, next) => {
  try {
    const {id, ...event} = req.body;
    const record = await eventQuery.updateEventById(id, event);
    res.json(req.body);
  } catch (err) {
    return next(err);
  }
};

// Delete
module.exports.delete = async (req, res, next) => {
  try {
    const id = req.body.id;
    const deleted = await eventQuery.deleteEventById(id)
    if (deleted) res.json(deleted);
    else throw new createHttpError.BadGateway('Cant delete');
  } catch (err) {
    return next(err);
  }
};

// Update Picture
module.exports.updatePicture = (req, res, next) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    const id = fields.id;

    if (!id) {
      var err = new Error('ID not found.');
      return next(err);
    } else {
      if (files.filetoupload.name && !files.filetoupload.name.match(/\.(jpg|jpeg|png)$/i)) {
        var err = new Error('Please select .jpg or .png file only');
        return next(err);
      } else if (files.filetoupload.size > 2097152) {
        var err = new Error('Please select file size < 2mb');
        return next(err);
      } else {
        var newFileName = utils.timestampFilename(files.filetoupload.name);

        var oldpath = files.filetoupload.path;
        var newpath = __basedir + '/public/uploads/pictures/' + newFileName;
        fs.rename(oldpath, newpath, function (err) {
          if (err) {
            return next(err);
          }

          Event.update(
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
                status: 'success',
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
    const result = await Event.findOne({
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
      to: 'test@example.com',
      subject: 'Test email',
      html: `Hi there! <br/><br/>
			This is just a test email from boilerplate code<br/><br/>
			Your event is: ${result.event}<br/><br/>
			Thank You.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      status: 'success',
      result: result,
    });
  } catch (err) {
    return next(err);
  }
};
