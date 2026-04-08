const ApiResponse = require('../../utils/apiResponse');

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error.';
  const details =
    process.env.NODE_ENV === 'production'
      ? []
      : err.details && Array.isArray(err.details)
        ? err.details
        : err.stack
          ? [err.stack]
          : [];

  return ApiResponse.error(res, message, statusCode, details);
};

module.exports = {
  notFoundHandler,
  errorMiddleware,
};
