const { body, param } = require('express-validator');

const createInterviewValidator = [
  body('audio')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Audio file is required.');
      }

      return true;
    }),
  body('title').optional().isString().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters.'),
  body('interviewType')
    .optional()
    .isIn(['mock', 'practice', 'assessment'])
    .withMessage('Interview type must be mock, practice, or assessment.'),
  body('year').optional().isIn(['FY', 'SY', 'TY', 'LY']).withMessage('Year must be one of FY, SY, TY, or LY.'),
];

const interviewIdParamValidator = [
  param('id').trim().notEmpty().withMessage('Interview id is required.'),
];

module.exports = {
  createInterviewValidator,
  interviewIdParamValidator,
};
