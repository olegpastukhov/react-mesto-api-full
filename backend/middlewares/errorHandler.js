const errorHandler = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(err.stack || err);
  const status = err.statusCode || 500;
  const message = err.message || 'Server error';

  res.status(status).send({
    err,
    message,
  });
  next();
};

module.exports = errorHandler;
