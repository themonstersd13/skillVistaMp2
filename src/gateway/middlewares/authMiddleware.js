const { HTTP_STATUS } = require('../../config/constants');
const ApiResponse = require('../../utils/apiResponse');
const { verifyToken } = require('../../utils/jwt');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Authorization token is required.', HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid or expired token.', HTTP_STATUS.UNAUTHORIZED);
  }
};

module.exports = authMiddleware;
