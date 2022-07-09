require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres' /* 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
  port: process.env.DB_PORT
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('💾 Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Create Models
const { UserModel } = require('./models/User');
const User = UserModel(sequelize);

const { ClassroomModel } = require('./models/Classroom');
const Classroom = ClassroomModel(sequelize);

const { ClassroomMemberModel } = require('./models/ClassroomMember');
const ClassroomMember = ClassroomMemberModel(sequelize, User, Classroom);

const { ChannelModel } = require('./models/Channel');
const Channel = ChannelModel(sequelize, Classroom);

const { MessageModel } = require('./models/Message');
const Message = MessageModel(sequelize, Channel, User);

const { AttachmentModel } = require('./models/Attachment');
const Attachment = AttachmentModel(sequelize, Channel, User);

const { NotificationModel } = require('./models/Notification');
const Notification = NotificationModel(sequelize, Channel, User);

const { EventModel } = require('./models/Event');
const Event = EventModel(sequelize);

// const { InvitationModel } = require("./models/Invitation");
// const Invitation = InvitationModel(sequelize);

// Relationships
User.belongsToMany(Classroom, { through: ClassroomMember });
Classroom.belongsToMany(User, { through: ClassroomMember });

Message.belongsTo(Channel, {
  foreignKey: { allowNull: false },
  onDelete: 'CASCADE',
});
Channel.hasMany(Message, {
  foreignKey: { allowNull: false },
  onDelete: 'CASCADE',
});

Message.belongsTo(User);
User.hasMany(Message);

Classroom.hasMany(Channel, {
  foreignKey: { allowNull: false },
  onDelete: 'CASCADE',
});
Channel.belongsTo(Classroom, {
  foreignKey: { allowNull: false },
  onDelete: 'CASCADE',
});

Channel.hasMany(User, {
  as: 'userActiveInChannel',
  foreignKey: 'active_in_channel',
});
User.belongsTo(Channel, {
  as: 'userActiveInChannel',
  foreignKey: 'active_in_channel',
});

Event.belongsTo(User, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});
User.hasMany(Event, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Event.belongsTo(Classroom, {
  foreignKey: 'room_id',
  onDelete: 'CASCADE',
});
Classroom.hasMany(Event, {
  foreignKey: 'room_id',
  onDelete: 'CASCADE',
});

Notification.belongsTo(User, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});
User.hasMany(Notification, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

// Message
Message.hasMany(Attachment, {
  foreignKey: { allowNull: true },
  onDelete: 'CASCADE',
});

Attachment.belongsTo(Message, {
  foreignKey: { allowNull: true },
  onDelete: 'CASCADE',
});

if (process.env.MIGRATE_DB == 'TRUE') {
  sequelize.sync().then(() => {
    console.log(`All tables synced!`);
    process.exit(0);
  });
}

module.exports = {
  User,
  Classroom,
  Channel,
  Message,
  ClassroomMember,
  Event,
  Notification,
  Attachment
};
