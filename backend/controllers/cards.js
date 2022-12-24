const Card = require('../models/card');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenError = require('../errors/ForbiddenError');
const NotFoundError = require('../errors/NotFoundError');

// eslint-disable-next-line consistent-return
const createCard = async (req, res, next) => {
  const { name, link } = req.body;
  try {
    // eslint-disable-next-line no-underscore-dangle
    const card = await Card.create({ name, link, owner: req.user._id });
    if (card) {
      return res.status(201).json(card);
    }
  } catch (e) {
    if (e.name === 'ValidationError') {
      return next(new BadRequestError('Invalid req data'));
    }
    return next(e);
  }
};

const getCards = async (req, res, next) => {
  try {
    const cards = await Card.find({});
    return res.status(200).json(cards);
  } catch (e) {
    return next(e);
  }
};

const deleteCard = async (req, res, next) => {
  const { _id } = req.user;
  const { cardId } = req.params;
  try {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    if (card.owner.valueOf() !== _id) {
      throw new ForbiddenError('Forbidden');
    }
    const deletedCard = await Card.findByIdAndRemove(cardId);
    return res.status(200).json(deletedCard);
  } catch (e) {
    return next(e);
  }
};

const likeCard = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndUpdate(
      req.params.cardId,
      // eslint-disable-next-line no-underscore-dangle
      { $addToSet: { likes: req.user._id } }, // добавить _id в массив, если его там нет
      { new: true },
    );
    if (!card) {
      return next(new NotFoundError('Card not found. Can`t set like'));
    }
    return res.status(200).json(card);
  } catch (e) {
    return next(e);
  }
};

const dislikeCard = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndUpdate(
      req.params.cardId,
      // eslint-disable-next-line no-underscore-dangle
      { $pull: { likes: req.user._id } }, // убрать _id из массива
      { new: true },
    );
    if (!card) {
      return next(new NotFoundError('Card not found. Can`t set dislike'));
    }
    return res.status(200).json(card);
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
