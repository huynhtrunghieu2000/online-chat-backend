require('dotenv').config();
// Load model
const { User, Classroom, Notification } = require('../db');
const { Op } = require('sequelize');

const utils = require('../utils');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');

const notificationQuery = require('../query/notification');

// SignUp
module.exports.signUp = async (req, res, next) => {
  try {
    const email = req.body.email;

    // encrypt password
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);
    const password = hash;

    const token = crypto.randomBytes(16).toString('hex');

    const numberOfUsers = await User.count();
    const record = await User.create({
      email: email,
      password: password,
      token: token,
      is_admin: numberOfUsers > 0 ? false : true,
    });

    // Send the email
    var transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_POST,
      auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASS,
      },
    });
    var verificationLink = `${process.env.CLIENT_URL}/auth/register-verify/?token=${token}`;

    var mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Thank you for signing up',
      html: `Congratulations!<br/><br/>
        You have successfully signed up. Please click the link below to verify your account:<br/>
        <a href="${verificationLink}" target="_blank">Verify email</a><br/><br/>
        Thank you.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      status: 'success',
      result: {
        record: record,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// Verify Signup Link
module.exports.signUpVerify = async (req, res, next) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      where: {
        token: token,
        is_verified: false,
      },
    });

    if (user) {
      const record = await User.update(
        {
          token: '',
          is_verified: true,
        },
        {
          where: {
            id: {
              [Op.eq]: user.id,
            },
          },
        }
      );

      return res.json({
        status: 'success',
      });
    } else {
      let err = new Error('Invalid token provided or user already verified');
      err.field = 'token';
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

// Login
module.exports.login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({
      where: {
        email: email,
        is_verified: true,
      },
      include: {
        model: Notification,
        order: [['createdAt', 'desc']],
      },
    });
    if (user) {
      const isMatched = await bcrypt.compare(password, user.password);
      if (isMatched === true) {
        var userData = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          bio: user.bio,
          is_admin: user.is_admin,
          notifications: user.notifications,
        };
        return res.json({
          user: userData,
          token: jwt.sign(userData, process.env.AUTH_SECRET, {
            expiresIn: '7d',
          }), // Expires in 2 Hour
        });
      } else {
        let err = new Error('Invalid email or password entered');
        err.field = 'login';
        return next(err);
      }
    } else {
      let err = new Error('Invalid email or password entered');
      err.field = 'login';
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

// Get Logged in user
module.exports.getLoggedInUser = async (req, res, next) => {
  try {
    var token = req.headers.authorization;
    if (token) {
      // verifies secret and checks if the token is expired
      let id = -1;
      jwt.verify(token.replace(/^Bearer\s/, ''), process.env.AUTH_SECRET, (err, decoded) => {
        if (err) {
          let err = new Error('Unauthorized');
          err.field = 'login';
          return next(err);
        } else id = decoded.id;
      });
      console.log(id);
      const user = await User.findOne({
        where: {
          id: id,
          is_verified: true,
        },
        include: {
          model: Notification,
          order: [['createdAt', 'desc']],
        },
      });
      if (!user) throw new createHttpError.Unauthorized();
      return res.json({ status: 'success', user: user });
    } else {
      throw new createHttpError.Unauthorized();
    }
  } catch (error) {
    return next(error);
  }
};

// Update Profile
module.exports.updateProfile = async (req, res, next) => {
  try {
    const id = req.user.id;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const bio = req.body.bio;
    const email = req.body.email;
    const avatar = req.body.avatar;

    const result = User.update(
      {
        first_name: first_name,
        last_name: last_name,
        bio: bio,
        email: email,
        avatar: avatar,
      },
      {
        where: {
          id: {
            [Op.eq]: id,
          },
        },
      }
    );

    return res.json({
      status: 'success',
      result: req.body,
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Change Password
module.exports.changePassword = async (req, res, next) => {
  try {
    console.log(req.body);
    const token = req.headers.authorization;
    let id = -1;
    jwt.verify(token.replace(/^Bearer\s/, ''), process.env.AUTH_SECRET, (err, decoded) => {
      if (err) {
        let err = new Error('Unauthorized');
        err.field = 'login';
        return next(err);
      } else id = decoded.id;
    });
    const user = await User.findOne({
      where: {
        id: id,
        is_verified: true,
      },
    });
    if (user) {
      const isMatched = await bcrypt.compare(req.body.old_password, user.password);
      if (isMatched) {
        // encrypt password
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.new_password, salt);
        const new_password = hash;
        const result = User.update(
          {
            password: new_password,
          },
          {
            where: {
              id: {
                [Op.eq]: id,
              },
            },
          }
        );

        return res.json({});
      } else throw new createHttpError.BadRequest('Old password not match');
    } else throw new createHttpError.BadRequest('Something wrong...');
  } catch (err) {
    return next(err);
  }
};

// Forgot Password
module.exports.forgotPassword = async (req, res, next) => {
  try {
    var email = req.body.email;
    var token = crypto.randomBytes(16).toString('hex');

    const result = await User.update(
      {
        token: token,
      },
      {
        where: {
          email: {
            [Op.eq]: email,
          },
        },
      }
    );

    // Send the email
    var transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_POST,
      auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASS,
      },
    });

    var verificationLink = `${process.env.CLIENT_URL}/forgot-password-verify/?token=${token}`;

    var mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Reset password',
      html: `Hi there! <br/><br/>
			Please click on the link below to reset your password:<br/>
			<a href="${verificationLink}" target="_blank">${verificationLink}</a><br/><br/>
			Thank You.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      status: 'success',
      result: result,
    });
  } catch (err) {
    return next(err);
  }
};

// Forgot Password Verify Link
module.exports.forgotPasswordVerify = async (req, res, next) => {
  try {
    var token = req.params.token;

    const user = await User.findOne({
      where: {
        token: token,
      },
    });

    if (user) {
      return res.json({
        message: 'Validation link passed',
        type: 'success',
      });
    } else {
      let err = new Error('Invalid token provided');
      err.field = 'token';
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

// Reset Password
module.exports.resetPassword = async (req, res, next) => {
  try {
    var token = req.body.token;
    // encrypt password
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.new_password, salt);
    const new_password = hash;

    const result = await User.update(
      {
        password: new_password,
        token: '',
      },
      {
        where: {
          token: {
            [Op.eq]: token,
          },
        },
      }
    );

    return res.json({
      status: 'success',
      result: result,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports.searchUser = async (req, res, next) => {
  try {
    var search = req.query.search;
    console.log(search);
    var users = await User.findAll({
      where: {
        [Op.or]: [
          {
            first_name: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            last_name: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            email: {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      },
      attributes: ['id', 'email', 'first_name', 'last_name', 'avatar'],
      include: {
        model: Classroom,
      },
    });
    console.log(users);
    return res.json(users);
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

module.exports.updateReadNotification = async (req, res, next) => {
  try {
    const is_read = req.body.is_read;
    const notificationIds = req.body.ids;
    await notificationQuery.updateNotificationRead(is_read, notificationIds);
    res.json({});
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
