require('dotenv').config();
// Load model
const { Classroom, Channel, ClassroomMember, User, Event } = require('../db');
const { Op } = require('sequelize');
const classroomQuery = require('../query/classroom');
const notificationQuery = require('../query/notification');
const eventQuery = require('../query/event');
const userQuery = require('../query/user');
const utils = require('../utils');
var formidable = require('formidable');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const createHttpError = require('http-errors');
const socketServer = require('../socket-handler/socketServer');
const { NotificationTypes } = require('../models/Notification');

// Get All - for admin
module.exports.getAll = async (req, res, next) => {
  try {
    const { id, is_admin } = jwt.decode(req.headers.authorization.split(' ')[1]);
    if (is_admin) {
      jwt.verify(req.headers.authorization.split(' ')[1], process.env.AUTH_SECRET, (err, decoded) => {
        if (err) throw err;
      });
      const classrooms = await Classroom.findAll({
        where: {
          deletedAt: null,
        },
      });
      res.json(classrooms);
    } else {
      const classroomMember = await ClassroomMember.findAll({
        where: {
          UserId: id,
          deletedAt: null,
        },
      });
      const classrooms = await Classroom.findAll({
        where: {
          id: {
            [Op.in]: classroomMember.map((item) => item.ClassroomId),
          },
        },
      });
      console.log(classrooms.map((classroom) => classroom.get({ plain: true })));
      res.json(classrooms);
    }
  } catch (err) {
    console.log(err);
    console.log(err);
    return next(err);
  }
};

// DONE: Get One
module.exports.getOne = async (req, res, next) => {
  try {
    const classroomId = req.params.id;
    console.log(req.params);
    const { id } = jwt.decode(req.headers.authorization.split(' ')[1]);
    const isMemberOfRoom = await classroomQuery.isMemberOfRoom(id, classroomId);
    if (!isMemberOfRoom) throw new createHttpError[404]();
    const classroom = await Classroom.findOne({
      where: {
        id: classroomId,
        deletedAt: null,
      },
      include: [
        {
          model: Channel,
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          attributes: ['id', 'email', 'avatar', 'first_name', 'last_name'],
          through: {
            attributes: ['role'],
          },
        },
        {
          model: Event,
        },
      ],
    });
    if (classroom) {
      res.json(classroom);
    } else {
      throw new createHttpError.NotFound('Room not found.');
    }
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// DONE: Create
module.exports.create = async (req, res, next) => {
  try {
    const classroom = req.body;
    const token = crypto.randomBytes(16).toString('hex');

    const newClassroom = await Classroom.create({
      ...classroom,
      is_private: false,
      code: token,
    });

    await ClassroomMember.create({
      ClassroomId: newClassroom.dataValues.id,
      UserId: newClassroom.dataValues.created_by,
      role: 'owner',
    });

    await Channel.create({
      name: 'General',
      ClassroomId: newClassroom.dataValues.id,
      type: 'text',
    });

    res.json(newClassroom);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// TODO: Update
module.exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const classroom = req.body;
    console.log(classroom);

    const record = await Classroom.update(classroom, {
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
    console.log(record);
    res.json(req.body);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// TODO: Delete - for admin
module.exports.delete = async (req, res, next) => {
  try {
    const classroomId = req.body.id;
    const { id, is_admin } = jwt.decode(req.headers.authorization.split(' ')[1]);

    const isAdminOfRoom = await classroomQuery.isAdminOfRoom(id, classroomId);
    if (is_admin || isAdminOfRoom) {
      const deleted = await Classroom.destroy({
        where: {
          id: {
            [Op.eq]: classroomId,
          },
        },
      });
      res.json(deleted);
    } else {
      throw new createHttpError.BadRequest('You are not admin');
    }
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Member ====================
module.exports.inviteToClassroom = async (req, res, next) => {
  try {
    const classroomId = req.params.id;
    console.log(classroomId);
    const classroom = await classroomQuery.getClassroomById(classroomId);
    if (!classroom) throw new createHttpError.NotFound('Room not found.');

    const id = req.body.user_ids[0];
    console.log('🚀 ~ file: classroomsController.js ~ line 169 ~ module.exports.inviteToClassroom= ~ id', id);
    // console.log('🚀 ~ file: classroomsController.js ~ line 165 ~ module.exports.inviteToClassroom= ~ userIds', userIds);
    // userIds.forEach((id) => {
    // });
    const user = await userQuery.getUserById(id);
    if (!user) throw new createHttpError.NotFound('User not found.');
    await classroomQuery.addUserToClass(id, classroomId);
    const newClassroom = await Classroom.findOne({
      where: {
        id: classroomId,
      },
      include: [
        {
          model: Channel,
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          attributes: ['id', 'email', 'avatar', 'first_name', 'last_name'],
          through: {
            attributes: ['role'],
          },
        },
      ],
    });
    const notificationData = {
      room: {
        id: newClassroom.dataValues.id,
        name: newClassroom.dataValues.name,
        avatar: newClassroom.dataValues.avatar,
      },
    };
    const notificationCreated = await notificationQuery.addNotification(
      `You are added to room ${newClassroom.dataValues.name}`,
      NotificationTypes.ROOM_INVITATION,
      id,
      notificationData
    );
    socketServer.announceNewNotificationToUser(id, notificationCreated);
    res.json(newClassroom);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports.getByInviteLink = async (req, res, next) => {
  try {
    const code = req.query.code;
    const room = await classroomQuery.getClassroomByCode(code);
    if (!room?.dataValues.id) throw new createHttpError.NotFound('Not found or room is private');
    res.json(room);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports.joinByInviteCode = async (req, res, next) => {
  try {
    const code = req.body.code;
    const { id, is_admin } = jwt.decode(req.headers.authorization.split(' ')[1]);
    const room = await classroomQuery.getClassroomByCode(code);
    if (room?.dataValues.id) {
      await classroomQuery.addUserToClass(id, room.dataValues.id);
    } else throw new createHttpError.NotFound('Not found or room is private');
    res.json(room);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports.joinByInviteCode = async (req, res, next) => {
  try {
    const code = req.body.code;
    const { id, is_admin } = jwt.decode(req.headers.authorization.split(' ')[1]);
    const room = await classroomQuery.getClassroomByCode(code);
    if (room?.dataValues.id) {
      await classroomQuery.addUserToClass(id, room.dataValues.id);
    } else throw new createHttpError.NotFound('Not found or room is private');
    res.json(room);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports.updateRole = async (req, res, next) => {
  try {
    const classroomId = req.body.id;
    const userId = req.body.user_id;
    const role = req.body.role;
    console.log(req.body);
    await classroomQuery.updateRoleUserClass(userId, classroomId, role);
    const room = await classroomQuery.getClassroomById(classroomId);
    const notificationData = {
      room: {
        id: room.dataValues.id,
        name: room.dataValues.name,
        avatar: room.dataValues.avatar,
      },
      role: role,
    };
    const newNotification = await notificationQuery.addNotification(
      '',
      NotificationTypes.ROOM_ROLE_CHANGE,
      userId,
      notificationData
    );
    socketServer.announceNewNotificationToUser(userId, newNotification);
    res.json(classroomId);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports.leaveRoom = async (req, res, next) => {
  try {
    const classroomId = req.body.id;
    const userId = req.body.user_id;
    console.log(req.body);
    const deleted = await classroomQuery.removeUserFromRoom(userId, classroomId);
    res.json(classroomId);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports.createEventForRoom = async (req, res, next) => {
  try {
    const classroomId = req.body.id;
    const { id, email, first_name, last_name } = jwt.decode(req.headers.authorization.split(' ')[1]);
    const event = req.body.event;
    console.log(req.body);
    const listUserInRoom = await classroomQuery.getUserIdsInRoom(classroomId);
    console.log(
      '🚀 ~ file: classroomsController.js ~ line 317 ~ module.exports.createEventForRoom= ~ listUserInRoom',
      listUserInRoom
    );
    const roomEvent = await eventQuery.createNewEvent({
      ...event,
      room_id: classroomId,
      created_by: id,
    });
    console.log("🚀 ~ file: classroomsController.js ~ line 336 ~ module.exports.createEventForRoom= ~ roomEvent", roomEvent)
    await Promise.all(
      listUserInRoom.map((userId) => {
        console.log('==== create event for user id', userId ,'by' , id);
        return (async () => {
          await eventQuery.createNewEvent({
            ...event,
            user_id: userId,
            created_by: id,
            origin_event: roomEvent.dataValues.id
          });
          if (Number(userId) === Number(id)) return;
          console.log('==== create notification for user id', userId);

          const newNotification = await notificationQuery.addNotification('', NotificationTypes.EVENT_INVITED, userId, {
            created_by: {
              id,
              email,
              first_name,
              last_name,
            },
            event,
          });
          socketServer.announceNewNotificationToUser(userId, newNotification);
        })();
      })
    );

    res.json(roomEvent);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
module.exports.updateEventForRoom = async (req, res, next) => {
  try {
    const eventId = req.body.id;
    const { id, email, first_name, last_name } = jwt.decode(req.headers.authorization.split(' ')[1]);
    const event = req.body.event;
    console.log(req.body);
    const listUserInRoom = await classroomQuery.getUserIdsInRoom(classroomId);
    const roomEvent = await eventQuery.updateEventById(eventId, {
      ...event,
    });
    console.log(
      listUserInRoom.map((userId) => {
        console.log('==== update event for user id', userId);
        return (async () => {
          await eventQuery.updateEventByOriginEventId(eventId, event);
          if (Number(userId) === Number(id)) return;
          const newNotification = await notificationQuery.addNotification('Event updated', NotificationTypes.EVENT_CHANGED, userId, {
            updated_by: {
              id,
              email,
              first_name,
              last_name,
            },
            event,
          });
          socketServer.announceNewNotificationToUser(userId, newNotification);
        })();
      })
    );

    res.json(roomEvent);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
module.exports.deleteEventForRoom = async (req, res, next) => {
  try {
    const classroomId = req.body.id;
    const { id, email, first_name, last_name } = jwt.decode(req.headers.authorization.split(' ')[1]);
    const event = req.body.event;
    console.log(req.body);
    const listUserInRoom = await classroomQuery.getUserIdsInRoom(classroomId);
    console.log(
      '🚀 ~ file: classroomsController.js ~ line 317 ~ module.exports.createEventForRoom= ~ listUserInRoom',
      listUserInRoom
    );
    const roomEvent = await eventQuery.createNewEvent({
      ...event,
      room_id: classroomId,
      created_by: id,
    });
    console.log(
      listUserInRoom.map((userId) => {
        console.log('==== create event for user id', userId);
        return (async () => {
          await eventQuery.createNewEvent({
            ...event,
            user_id: userId,
            created_by: id,
          });
          const newNotification = await notificationQuery.addNotification('', NotificationTypes.EVENT_INVITED, userId, {
            created_by: {
              id,
              email,
              first_name,
              last_name,
            },
            event,
          });
          socketServer.announceNewNotificationToUser(userId, newNotification);
        })();
      })
    );

    res.json(roomEvent);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// module.exports.createPublicToken = async (req, res, next) => {
//   try {
//     const classroomId = req.body.id;
//     const token = crypto.randomBytes(16).toString('hex');
//     const record = await Classroom.update({
//       where: {
//         id: {
//           [Op.eq]: classroomId,
//         },
//       },
//       data: {
//         code: token,
//         is_private: false,
//       },
//     });

//     res.json(token);
//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// };

// module.exports.deletePublicToken = async (req, res, next) => {
//   try {
//     const classroomId = req.body.id;
//     const record = await Classroom.update({
//       where: {
//         id: {
//           [Op.eq]: classroomId,
//         },
//       },
//       data: {
//         code: null,
//         is_private: true,
//       },
//     });

//     res.json(record);
//   } catch (err) {
//     console.log(err);
//     return next(err);
//   }
// };

// Update Picture
// module.exports.updatePicture = (req, res, next) => {
//   var form = new formidable.IncomingForm();
//   form.parse(req, (err, fields, files) => {
//     const id = fields.id;

//     if (!id) {
//       var err = new Error('ID not found.');
//       return next(err);
//     } else {
//       if (files.filetoupload.name && !files.filetoupload.name.match(/\.(jpg|jpeg|png)$/i)) {
//         var err = new Error('Please select .jpg or .png file only');
//         return next(err);
//       } else if (files.filetoupload.size > 2097152) {
//         var err = new Error('Please select file size < 2mb');
//         return next(err);
//       } else {
//         var newFileName = utils.timestampFilename(files.filetoupload.name);

//         var oldpath = files.filetoupload.path;
//         var newpath = __basedir + '/public/uploads/pictures/' + newFileName;
//         fs.rename(oldpath, newpath, function (err) {
//           if (err) {
//             return next(err);
//           }

//           Classroom.update(
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
//                 status: 'success',
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
