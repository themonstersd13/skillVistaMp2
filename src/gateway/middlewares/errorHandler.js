const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../../config/constants');
const ApiResponse = require('../../utils/apiResponse');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return ApiResponse.error(
    res,
    'Validation failed.',
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors.array()
  );
};

const notFoundHandler = (req, res) => {
  return ApiResponse.error(res, `Route not found: ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong.';

  if (res.headersSent) {
    return next(err);
  }

  return ApiResponse.error(
    res,
    message,
    statusCode,
    err.details || (req.app.get('env') === 'development' ? err.stack : undefined)
  );
};

module.exports = {
  validateRequest,
  notFoundHandler,
  errorHandler,
};
