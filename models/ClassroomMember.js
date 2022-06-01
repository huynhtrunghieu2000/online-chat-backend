const { DataTypes } = require("sequelize");

module.exports.ClassroomMemberModel = (sequelize, User, Classroom) => {
  return sequelize.define(
    "ClassroomMember",
    {
      role: {
        type: DataTypes.ENUM("owner", "admin", "member"),
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
