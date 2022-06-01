require("dotenv").config();
// Load model
const { Classroom, Channel, ClassroomMember } = require("../db");
const { Op } = require("sequelize");

const utils = require("../utils");
var formidable = require("formidable");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const createHttpError = require("http-errors");

// Get All - for admin
module.exports.getAll = async (req, res, next) => {
  try {
    const { id, is_admin } = jwt.decode(
      req.headers.authorization.split(" ")[1]
    );
    if (is_admin) {
      jwt.verify(
        req.headers.authorization.split(" ")[1],
        process.env.AUTH_SECRET,
        (err, decoded) => {
          if (err) throw err;
        }
      );
      const classrooms = await Classroom.findAll();
      res.json(classrooms);
    } else {
      const classroomMember = await ClassroomMember.findAll({
        where: {
          UserId: id,
        },
      });
      const classrooms = await Classroom.findAll({
        where: {
          id: {
            [Op.in]: classroomMember.map((item) => item.ClassroomId),
          },
        },
      });
      res.json(classrooms);
    }
  } catch (err) {
    return next(err);
  }
};

// DONE: Get One
module.exports.getOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const classroom = await Classroom.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: Channel,
          include: "userActiveInChannel",
        },
      ],
    });
    if (classroom) {
      res.json(classroom);
    } else {
      throw new createHttpError.NotFound('Room not found.');
    }
  } catch (err) {
    return next(err);
  }
};

// DONE: Create
module.exports.create = async (req, res, next) => {
  try {
    const classroom = req.body;
    const newClassroom = await Classroom.create({
      ...classroom,
    });

    await ClassroomMember.create({
      ClassroomId: newClassroom.dataValues.id,
      UserId: newClassroom.dataValues.created_by,
      role: "owner",
    });

    await Channel.create({
      name: "General",
      ClassroomId: newClassroom.dataValues.id,
      type: "text",
    });

    res.json(newClassroom);
  } catch (err) {
    return next(err);
  }
};

// TODO: Update
module.exports.update = async (req, res, next) => {
  try {
    const id = req.body.id;
    const classroom = req.body.classroom;
    const status = req.body.status;

    const record = await Classroom.update(
      {
        classroom: classroom,
        status: status,
      },
      {
        where: {
          id: {
            [Op.eq]: id,
          },
        },
      }
    );

    res.json({
      status: "success",
      result: {
        record: req.body,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// TODO: Delete - for admin
module.exports.delete = async (req, res, next) => {
  try {
    const id = req.body.id;

    const deleted = await Classroom.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });

    res.json({
      status: "success",
      result: {
        affectedRows: deleted,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports.inviteToClassroom = async (req, res, next) => {
  try {
    const id = req.body.id;
    const email = req.body.email;
    const classroom = await Classroom.findOne({
      where: {
        id: id,
      },
    });
    const user = await utils.getUserByEmail(email);
    if (user) {
      await ClassroomMember.create({
        ClassroomId: classroom.dataValues.id,
        UserId: user.dataValues.id,
        role: "member",
      });
      res.json({
        status: "success",
        result: {
          user: user,
          classroom: classroom,
        },
      });
    } else {
      res.json({
        status: "error",
        result: {
          user: null,
          classroom: classroom,
        },
      });
    }
  } catch (err) {
    return next(err);
  }
};

module.exports.createPublicToken = async (req, res, next) => {
  try {
    const classroomId = req.body.id;
    const token = crypto.randomBytes(16).toString("hex");
    const record = await Classroom.update({
      where: {
        id: {
          [Op.eq]: classroomId,
        },
      },
      data: {
        invitation_code: token,
      },
    });

    res.json(record);
  } catch (err) {
    return next(err);
  }
};

module.exports.deletePublicToken = async (req, res, next) => {
  try {
    const classroomId = req.body.id;
    const record = await Classroom.update({
      where: {
        id: {
          [Op.eq]: classroomId,
        },
      },
      data: {
        invitation_code: null,
      },
    });

    res.json(record);
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

          Classroom.update(
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
