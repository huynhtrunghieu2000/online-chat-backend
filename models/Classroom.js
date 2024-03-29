const { DataTypes } = require("sequelize");

module.exports.ClassroomModel = (sequelize) => {
  return sequelize.define(
    "Classroom",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_private: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValues: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      }
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
