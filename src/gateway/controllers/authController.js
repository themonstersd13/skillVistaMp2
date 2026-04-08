const { HTTP_STATUS } = require('../../config/constants');
const ApiResponse = require('../../utils/apiResponse');
const authService = require('../../services/authService');

const register = async (req, res) => {
  const result = await authService.registerUser(req.body);

  return ApiResponse.success(
    res,
    result,
    'User registered successfully.',
    HTTP_STATUS.CREATED
  );
};

const login = async (req, res) => {
  const result = await authService.loginUser(req.body);

  return ApiResponse.success(
    res,
    result,
    'Login successful.',
    HTTP_STATUS.OK
  );
};

const me = async (req, res) => {
  const user = await authService.getUserById(req.user.id || req.user.sub);

  return ApiResponse.success(
    res,
    {
      user,
    },
    'Authenticated user fetched successfully.',
    HTTP_STATUS.OK
  );
};

module.exports = {
  register,
  login,
  me,
};
