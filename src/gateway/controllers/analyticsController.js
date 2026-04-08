const { HTTP_STATUS } = require('../../config/constants');
const ApiResponse = require('../../utils/apiResponse');
const analyticsService = require('../../services/analyticsService');

const getCohortAnalytics = async (req, res) => {
  const result = await analyticsService.getFacultyCohortAnalytics({
    requester: req.user,
  });

  return ApiResponse.success(
    res,
    result,
    'Cohort analytics fetched successfully.',
    HTTP_STATUS.OK
  );
};

const getStudentAnalytics = async (req, res) => {
  const result = await analyticsService.getStudentPersonalAnalytics({
    requester: req.user,
    studentId: req.params.studentId,
  });

  return ApiResponse.success(
    res,
    result,
    'Student analytics fetched successfully.',
    HTTP_STATUS.OK
  );
};

const getEvaluationHistory = async (req, res) => {
  const result = await analyticsService.getEvaluationHistory({
    requester: req.user,
    studentId: req.params.studentId,
  });

  return ApiResponse.success(
    res,
    result,
    'Evaluation history fetched successfully.',
    HTTP_STATUS.OK
  );
};

const getEvaluationById = async (req, res) => {
  const result = await analyticsService.getSingleEvaluation({
    requester: req.user,
    evaluationId: req.params.evaluationId,
  });

  return ApiResponse.success(
    res,
    result,
    'Evaluation fetched successfully.',
    HTTP_STATUS.OK
  );
};

module.exports = {
  getCohortAnalytics,
  getStudentAnalytics,
  getEvaluationHistory,
  getEvaluationById,
};
