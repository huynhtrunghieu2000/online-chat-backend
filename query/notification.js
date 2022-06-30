const { Notification } = require('../db');
const { Op } = require('sequelize');

module.exports.addNotification = (message, type, userId, data) => {
  return Notification.create({
    message,
    type,
    is_read: false,
    user_id: userId,
    data
  })
}

module.exports.updateNotificationRead = (is_read, ids) => {
  ids.forEach((id) => Notification.update({
    is_read: is_read
  }, {
    where: {
      id: id
    }
  }))
}