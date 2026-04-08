const env = require('./env');

const USER_ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  BAD_GATEWAY: 502,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
};

const APP_CONSTANTS = {
  APP_NAME: 'SkillVista Backend',
  API_PREFIX: '/api/v1',
  HEALTH_ROUTE: '/health',
  MAX_FILE_SIZE_BYTES: env.maxFileSizeMb * 1024 * 1024,
};

module.exports = {
  USER_ROLES,
  HTTP_STATUS,
  APP_CONSTANTS,
};
