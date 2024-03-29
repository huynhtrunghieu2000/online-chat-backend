const { Event, Classroom, ClassroomMember } = require('../db');
const { Op } = require('sequelize');

module.exports.getEventById = async (eventId) => {
  return await Event.findOne({
    where: {
      id: eventId,
    },
  });
};

module.exports.createNewEvent = async (event) => {
  return await Event.create(event);
};

module.exports.getEvents = async (query) => {
  return await Event.findAll({
    where: {
      [Op.or]: [
        {
          title: {
            [Op.like]: `%${query}%`,
          },
        },
        {
          description: {
            [Op.like]: `%${query}%`,
          },
        },
      ],
    },
  });
};

module.exports.getEventsByUserId = async (userId) => {
  return await Event.findAll({
    where: {
      user_id: userId,
    },
    exclude: 'user_id',
  });
};

module.exports.getEventsByOriginEventId = async (eventId) => {
  return await Event.findAll({
    where: {
      origin_event: eventId,
      user_id: {
        [Op.not]: null,
      },
    },
  });
};

module.exports.updateEventById = async (eventId, event) => {
  return await Event.update(event, {
    where: {
      id: eventId,
    },
  });
};

module.exports.updateEventByOriginEventId = async (eventId, event) => {
  return await Event.update(event, {
    where: {
      origin_event: eventId,
    },
  });
};

module.exports.deleteEventByOriginEventId = async (eventId) => {
  return await Event.destroy({
    where: {
      origin_event: eventId,
    },
  });
};

module.exports.deleteEventById = async (eventId) => {
  return await Event.destroy({
    where: {
      id: eventId,
    },
  });
};

module.exports.getEventsByUserIdAndDate = async (userId, date) => {
  return await Event.findAll({
    where: {
      user_id: userId,
      start_time: {
        [Op.lte]: date,
      },
      end_time: {
        [Op.gte]: date,
      },
    },
  });
};
