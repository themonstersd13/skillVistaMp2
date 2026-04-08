const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleAuth = require('../middlewares/roleAuth');
const { validateRequest } = require('../middlewares/errorHandler');
const {
  overviewValidator,
  studentAnalyticsValidator,
  evaluationIdValidator,
} = require('../validators/analyticsValidators');
const asyncHandler = require('../../utils/asyncHandler');
const { USER_ROLES } = require('../../config/constants');

const router = express.Router();

router.get(
  '/cohort',
  authMiddleware,
  roleAuth(USER_ROLES.FACULTY, USER_ROLES.ADMIN),
  overviewValidator,
  validateRequest,
  asyncHandler(analyticsController.getCohortAnalytics)
);

router.get(
  '/student/:studentId',
  authMiddleware,
  studentAnalyticsValidator,
  validateRequest,
  asyncHandler(analyticsController.getStudentAnalytics)
);

router.get(
  '/student/:studentId/history',
  authMiddleware,
  studentAnalyticsValidator,
  validateRequest,
  asyncHandler(analyticsController.getEvaluationHistory)
);

router.get(
  '/evaluations/:evaluationId',
  authMiddleware,
  evaluationIdValidator,
  validateRequest,
  asyncHandler(analyticsController.getEvaluationById)
);

module.exports = router;
