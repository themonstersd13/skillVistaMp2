class ErrorResponse extends Error {
  constructor(message, statusCode = 500, details = []) {
    super(message);
    this.name = 'ErrorResponse';
    this.statusCode = statusCode;
    this.details = Array.isArray(details) ? details : [details];
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
