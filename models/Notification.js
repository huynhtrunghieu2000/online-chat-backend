const { DataTypes } = require('sequelize');

module.exports.NotificationTypes = {
  ROOM_INVITATION: 'ROOM_INVITATION',
  ROOM_ROLE_CHANGE: 'ROOM_ROLE_CHANGE',
  EVENT_INVITED: 'EVENT_INVITED',
  EVENT_REMOVED: 'EVENT_REMOVED',
  EVENT_CHANGED: 'EVENT_CHANGED',
};
module.exports.NotificationModel = (sequelize, Channel, User) => {
  return sequelize.define(
    'notification',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      data: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      // Other model options go here
      freezeTableName: true,
      //tableName: 'tablename',
      timestamps: true,
      paranoid: true,
    }
  );
};
