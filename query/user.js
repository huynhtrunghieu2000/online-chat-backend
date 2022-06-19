const { User, Classroom } = require('../db');
const { Op } = require('sequelize');

module.exports.getUserById = async (userId) => {
  return await User.findOne({
    where: {
      id: userId,
    },
    attributes: ['id', 'email', 'first_name', 'last_name', 'avatar', 'bio']
  });
};

module.exports.getUserByIdWithRoomJoined = async (userId) => {
  return await User.findOne({
    where: {
      id: userId,
    },
    attributes: ['id'],
    include: {
      model: Classroom,
      attributes: ['id'],
      through: ['ClassroomId'],
    },
  });
};
