const { Attachment } = require('../db');
const { Op } = require('sequelize');

module.exports.addAttachment = async (attachment, msgId) => {
  return Attachment.create({
    name: attachment.name,
    url: attachment.url,
    type: attachment.type,
    size: attachment.size,
    MessageId: msgId
  })
}

module.exports.updateAttachmentRead = (is_read, ids) => {
  ids.forEach((id) => Notification.update({
    is_read: is_read
  }, {
    where: {
      id: id
    }
  }))
}