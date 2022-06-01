// TODO: get message pagination
require("dotenv").config();
// Load model
const { Message } = require("../db");
const { Op } = require("sequelize");

const utils = require("../utils");
var formidable = require("formidable");
var fs = require("fs");

// Get All
module.exports.getAllByChannel = async (req, res, next) => {
  try {
    const tasks = await Message.findAll();
    res.json({
      status: "success",
      result: tasks,
    });
  } catch (err) {
    return next(err);
  }
};

// Get One
module.exports.getOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const message = await Message.findOne({
      where: {
        id: id,
      },
    });
    res.json({
      status: "success",
      result: message,
    });
  } catch (err) {
    return next(err);
  }
};

// Create
module.exports.create = async (req, res, next) => {
  try {
    const message = req.body.message;
    const record = await Message.create({
      message: message,
    });

    res.json(record);
  } catch (err) {
    return next(err);
  }
};

// // Update
// module.exports.update = async (req, res, next) => {
//   try {
//     const id = req.body.id;
//     const message = req.body.message;
//     const status = req.body.status;

//     const record = await Message.update(
//       {
//         message: message,
//         status: status,
//       },
//       {
//         where: {
//           id: {
//             [Op.eq]: id,
//           },
//         },
//       }
//     );

//     res.json(req.body);
//   } catch (err) {
//     return next(err);
//   }
// };

// // Delete
// module.exports.delete = async (req, res, next) => {
//   try {
//     const id = req.body.id;

//     const deleted = await Message.destroy({
//       where: {
//         id: {
//           [Op.eq]: id,
//         },
//       },
//     });

//     res.json({
//       status: "success",
//       result: {
//         affectedRows: deleted,
//       },
//     });
//   } catch (err) {
//     return next(err);
//   }
// };

// // Update Picture
// module.exports.updatePicture = (req, res, next) => {
//   var form = new formidable.IncomingForm();
//   form.parse(req, (err, fields, files) => {
//     const id = fields.id;

//     if (!id) {
//       var err = new Error("ID not found.");
//       return next(err);
//     } else {
//       if (
//         files.filetoupload.name &&
//         !files.filetoupload.name.match(/\.(jpg|jpeg|png)$/i)
//       ) {
//         var err = new Error("Please select .jpg or .png file only");
//         return next(err);
//       } else if (files.filetoupload.size > 2097152) {
//         var err = new Error("Please select file size < 2mb");
//         return next(err);
//       } else {
//         var newFileName = utils.timestampFilename(files.filetoupload.name);

//         var oldpath = files.filetoupload.path;
//         var newpath = __basedir + "/public/uploads/pictures/" + newFileName;
//         fs.rename(oldpath, newpath, function (err) {
//           if (err) {
//             return next(err);
//           }

//           Message.update(
//             {
//               picture: newFileName,
//             },
//             {
//               where: {
//                 id: {
//                   [Op.eq]: id,
//                 },
//               },
//             }
//           )
//             .then((updated) => {
//               res.json({
//                 status: "success",
//                 result: {
//                   newFileName: newFileName,
//                   affectedRows: updated,
//                 },
//               });
//             })
//             .catch((err) => {
//               return next(err);
//             });
//         });
//       }
//     }
//   });
// };

// // Send email
// module.exports.sendEmail = async (req, res, next) => {
//   try {
//     const id = req.body.id;
//     const result = await Message.findOne({
//       where: {
//         id: id,
//       },
//     });

//     var transporter = nodemailer.createTransport({
//       host: process.env.MAIL_HOST,
//       port: process.env.MAIL_POST,
//       auth: {
//         user: process.env.MAIL_AUTH_USER,
//         pass: process.env.MAIL_AUTH_PASS,
//       },
//     });

//     var mailOptions = {
//       from: process.env.MAIL_FROM,
//       to: "test@example.com",
//       subject: "Test email",
//       html: `Hi there! <br/><br/>
// 			This is just a test email from boilerplate code<br/><br/>
// 			Your message is: ${result.message}<br/><br/>
// 			Thank You.`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.json({
//       status: "success",
//       result: result,
//     });
//   } catch (err) {
//     return next(err);
//   }
// };
