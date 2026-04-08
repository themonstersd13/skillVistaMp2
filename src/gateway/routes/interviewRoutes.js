const express = require('express');
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');
const roleAuth = require('../middlewares/roleAuth');
const {
  createInterviewValidator,
  interviewIdParamValidator,
} = require('../validators/interviewValidators');
const asyncHandler = require('../../utils/asyncHandler');
const { USER_ROLES } = require('../../config/constants');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleAuth(USER_ROLES.STUDENT, USER_ROLES.ADMIN),
  upload.single('audio'),
  createInterviewValidator,
  validateRequest,
  asyncHandler(interviewController.createInterview)
);

router.get(
  '/:id',
  authMiddleware,
  roleAuth(USER_ROLES.STUDENT, USER_ROLES.FACULTY, USER_ROLES.ADMIN),
  interviewIdParamValidator,
  validateRequest,
  asyncHandler(interviewController.getInterviewStatus)
);

module.exports = router;
