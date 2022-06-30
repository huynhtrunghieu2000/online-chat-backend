const { Classroom, Channel, ClassroomMember } = require('../db');
const { Op } = require('sequelize');

module.exports.getClassroomById = async (classId) => {
  return await Classroom.findOne({
    where: {
      id: classId,
    },
  });
};

module.exports.getClassroomByCode = async (code) => {
  return await Classroom.findOne({
    where: {
      code: code,
      is_private: false
    },
  });
};

module.exports.addUserToClass = async (userId, classroomId) => {
  const isAddedBefore = await ClassroomMember.findOne({
    where: {
      ClassroomId: classroomId,
      UserId: userId,
    },
    paranoid: false,
  });

  if (isAddedBefore) {
    return await ClassroomMember.restore(
      {
        role: 'member',
        deletedAt: null,
      },
      {
        where: {
          ClassroomId: classroomId,
          UserId: userId,
        },
      }
    );
  } else {
    return await ClassroomMember.create({
      ClassroomId: classroomId,
      UserId: userId,
      role: 'member',
    });
  }
};

module.exports.updateRoleUserClass = async (userId, classId, role) => {
  await ClassroomMember.update(
    {
      role: role,
    },
    {
      where: {
        ClassroomId: classId,
        UserId: userId,
      },
    }
  );
};

module.exports.getUserIdsInRoom = async (classroomId) => {
  const list = await ClassroomMember.findAll({
    where: {
      ClassroomId: classroomId,
    },
    attributes: ['UserId']
  });
  return list.map((item) => item.get({ plain: true}).UserId);
};

module.exports.isAdminOfRoom = async (userId, classroomId) => {
  return ClassroomMember.findOne({
    where: {
      ClassroomId: classroomId,
      UserId: userId,
      role: 'owner',
      deletedAt: null,
    },
  });
};
module.exports.isMemberOfRoom = async (userId, classroomId) => {
  return ClassroomMember.findOne({
    where: {
      ClassroomId: classroomId,
      UserId: userId,
      deletedAt: null,
    },
  });
};

module.exports.removeUserFromRoom = async (userId, classroomId) => {
  return ClassroomMember.destroy({
    where: {
      ClassroomId: classroomId,
      UserId: userId,
    },
  });
};
