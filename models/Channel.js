const { DataTypes } = require("sequelize");

module.exports.ChannelModel = (sequelize, Classroom) => {
  return sequelize.define(
    "Channel",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("text", "video", "announcement"),
        allowNull: false,
      },
    },
    {
      // Other model options go here
      freezeTableName: true,
      //tableName: 'tablename',
      paranoid: true,
      timestamps: true,
    }
  );
};
