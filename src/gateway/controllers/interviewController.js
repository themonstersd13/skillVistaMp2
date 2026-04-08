const { HTTP_STATUS } = require('../../config/constants');
const ApiResponse = require('../../utils/apiResponse');
const interviewService = require('../../services/interviewService');

const createInterview = async (req, res) => {
  const result = await interviewService.createInterviewSubmission({
    file: req.file,
    body: req.body,
    user: req.user,
  });

  return ApiResponse.success(
    res,
    result,
    'Interview submitted successfully.',
    HTTP_STATUS.CREATED
  );
};

const getInterviewStatus = async (req, res) => {
  const result = await interviewService.getInterviewStatusById({
    interviewId: req.params.id,
    user: req.user,
  });

  return ApiResponse.success(
    res,
    result,
    'Interview status fetched successfully.',
    HTTP_STATUS.OK
  );
};

module.exports = {
  createInterview,
  getInterviewStatus,
};
