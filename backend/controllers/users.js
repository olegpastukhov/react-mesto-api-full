require('dotenv').config();

// eslint-disable-next-line import/no-unresolved
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const NotFoundError = require('../errors/NotFoundError');
// const UnauthorizedError = require('../errors/UnauthorizedError');

const { NODE_ENV, JWT_SECRET } = process.env;

// eslint-disable-next-line consistent-return
// const login = async (req, res, next) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     next(new BadRequestError('Invalid email or password'));
//   }
//   try {
//     const user = await User.findUserByCredentials(email, password);
//     if (!user) {
//       next(new UnauthorizedError('User not found'));
//     }

// const payload = { _id: user._id };
// const tokenKey = JWT_SECRET;
// const token = jwt.sign(
//   payload,
//   NODE_ENV === 'production' ? tokenKey : 'some-secret-key',
//   { expiresIn: '7d' },
// );

//     const token = jwt.sign(
//       { _id: user._id },
//       NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key',
//       { expiresIn: '7d' },
//     );
//     res.send({ token });
//   } catch (e) {
//     return next(e);
//   }
// };
const login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    // eslint-disable-next-line consistent-return
    .then((user) => {
      // проверим существует ли такой email или пароль
      if (!user || !password) {
        return next(new BadRequestError('Неверный email или пароль.'));
      }

      // создадим токен
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key',
        {
          expiresIn: '7d',
        },
      );
      // вернём токен
      res.send({ token });
    })
    .catch(next);
};

const createUser = async (req, res, next) => {
  const {
    email,
    password,
    name,
    about,
    avatar,
  } = req.body;
  if (!email || !password) {
    next(new BadRequestError('Invalid email or password'));
  }
  try {
    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      next(new ConflictError(`User with ${email} already exists`));
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      name,
      about,
      avatar,
      password: hash,
    });
    return res.status(201).json({
      name: user.name,
      about: user.about,
      avatar: user.avatar,
      _id: user._id,
      email: user.email,
    });
  } catch (e) {
    if (e.name === 'ValidationError') {
      next(new BadRequestError('Invalid user data or avatars`s URL'));
    }
    return next(e);
  }
};

// const getCurrentUser = async (req, res, next) => {
//   const { _id } = req.user;
// eslint-disable-next-line no-constant-condition
// if (!userId) {
//   next(new BadRequestError('Invalid id'));
// }
//   try {
//     const user = await User.findById(_id);
//     if (!user) {
//       return next(new NotFoundError('User with this id not found'));
//     }
//     // return res.status(200).json(user);
//     return res.status(200).send(user);
//   } catch (e) {
//     return next(e);
//   }
// };

const getCurrentUser = (req, res, next) => {
  const { _id } = req.user;
  User.findById(_id).then((user) => {
    // проверяем, есть ли пользователь с таким id
    if (!user) {
      return next(new NotFoundError('Пользователь не найден.'));
    }
    // возвращаем пользователя, если он есть
    return res.status(200).send(user);
  }).catch(next);
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (e) {
    return next(e);
  }
};

const getUserById = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError('User not found by Id in params'));
    }
    return res.status(200).json(user);
  } catch (e) {
    return next(e);
  }
};

const updateUser = async (req, res, next) => {
  const { name, about } = req.body;
  try {
    // eslint-disable-next-line no-underscore-dangle
    const user = await User.findByIdAndUpdate(
      // eslint-disable-next-line no-underscore-dangle
      req.user._id,
      { name, about },
      { new: true, runValidators: true },
    );
    if (!user) {
      return next(new NotFoundError('updateUser User not found'));
    }
    return res.status(200).send(user);
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ message: e.message });
    }
    return next(e);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    // eslint-disable-next-line no-underscore-dangle
    const user = await User.findByIdAndUpdate(
      // eslint-disable-next-line no-underscore-dangle
      req.user._id,
      { avatar },
      { new: true, runValidators: true },
    );
    if (!user) {
      return next(new NotFoundError('updateAvatar User not found'));
    }
    return res.status(200).json({ avatar });
  } catch (e) {
    if (e.name === 'ValidationError') {
      next(new BadRequestError('Неверная ссылка'));
    }
    return next(e);
  }
};

module.exports = {
  getUsers,
  createUser,
  getCurrentUser,
  getUserById,
  updateUser,
  updateAvatar,
  login,
};
