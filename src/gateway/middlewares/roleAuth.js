const { HTTP_STATUS } = require('../../config/constants');
const ApiResponse = require('../../utils/apiResponse');

const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    const normalizedAllowedRoles = allowedRoles.flat().filter(Boolean);

    if (!req.user) {
      return ApiResponse.error(res, 'Authentication is required.', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!normalizedAllowedRoles.includes(req.user.role)) {
      return ApiResponse.error(res, 'You do not have permission to access this resource.', HTTP_STATUS.FORBIDDEN);
    }

    return next();
  };
};

module.exports = roleAuth;
