const { DataTypes } = require("sequelize");

module.exports.ClassroomMemberModel = (sequelize, User, Classroom) => {
  return sequelize.define(
    "ClassroomMember",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("owner", "admin", "member"),
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
