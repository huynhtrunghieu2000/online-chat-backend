const { User } = require('../db');
const { Op } = require('sequelize');

module.exports.getUserById = async (userId) => {
  return await User.findOne({
    where: {
      id: userId,
    },
  });
};


