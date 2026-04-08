const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const asyncHandler = require('../../utils/asyncHandler');
const roleAuth = require('../middlewares/roleAuth');
const { USER_ROLES } = require('../../config/constants');
const ApiResponse = require('../../utils/apiResponse');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, asyncHandler(authController.register));
router.post('/login', loginValidator, validateRequest, asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));
router.get('/admin-only', authMiddleware, roleAuth(USER_ROLES.ADMIN), (req, res) => {
  return ApiResponse.success(res, { role: req.user.role }, 'Admin access granted.');
});

module.exports = router;
