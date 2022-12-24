// eslint-disable-next-line import/no-unresolved
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const NotFoundError = require('../errors/NotFoundError');
const UnauthorizedError = require('../errors/UnauthorizedError');

// eslint-disable-next-line consistent-return
const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    next(new BadRequestError('Invalid email or password'));
  }
  try {
    const user = await User.findUserByCredentials(email, password);
    if (!user) {
      next(new UnauthorizedError('User not found'));
    }
    const payload = { _id: user._id };
    const tokenKey = 'some-secret-key';
    const token = jwt.sign(payload, tokenKey, { expiresIn: '7d' });
    return res.status(200).json({ token });
  } catch (e) {
    return next(e);
  }
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

const getCurrentUser = async (req, res, next) => {
  const { _id } = req.user;
  try {
    const user = await User.findById(_id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    return res.status(200).json(user);
  } catch (e) {
    return next(e);
  }
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
      return next(new NotFoundError('User not found'));
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
      return next(new NotFoundError('User not found'));
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
      return next(new NotFoundError('User not found'));
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
