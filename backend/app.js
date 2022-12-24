const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { errors } = require('celebrate');
const errorHandler = require('./middlewares/errorHandler');
const { login, createUser } = require('./controllers/users');
const NotFoundError = require('./errors/NotFoundError');
const auth = require('./middlewares/auth');
const {
  signUp, signIn,
} = require('./middlewares/validations');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const { PORT = 3000 } = process.env;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(requestLogger); // подключаем логгер запросов

app.post('/signup', signUp, createUser);
app.post('/signin', signIn, login);

app.use(auth);
app.use('/', require('./routes/users'));
app.use('/', require('./routes/cards'));

app.use('*', (req, res, next) => {
  next(new NotFoundError('Not found'));
});

app.use(errorLogger); // подключаем логгер ошибок

app.use(errors());
app.use(errorHandler);

mongoose.connect('mongodb://127.0.0.1:27017/mestodb', {
  useNewUrlParser: true,
}, () => {
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB!');
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`App listening to port: ${PORT}!`);
  });
});
