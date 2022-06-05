const { Classroom, Channel, ClassroomMember } = require('../db');
const { Op } = require('sequelize');

module.exports.getClassroomById = async (classId) => {
  return await ClassroomMember.findOne({
    where: {
      id: classId,
    },
  });
};

module.exports.addUserToClass = async (userId, classId) => {
  await ClassroomMember.create({
    ClassroomId: classId,
    UserId: userId,
    role: 'member',
  });
};

module.exports.updateRoleUserClass = async (userId, classId, role) => {
  await ClassroomMember.update(
    {
      ClassroomId: classId,
      UserId: userId,
      role: role,
    },
    {
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    }
  );
};
