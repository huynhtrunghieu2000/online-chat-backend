const { DataTypes } = require("sequelize");

module.exports.MessageModel = (sequelize, Channel, User) => {
  return sequelize.define(
    "Message",
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
    },
    {
      // Other model options go here
      freezeTableName: true,
      //tableName: 'tablename',
      timestamps: true,
    }
  );
};
