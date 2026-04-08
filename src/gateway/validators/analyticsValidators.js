const { param } = require('express-validator');

const overviewValidator = [];

const studentAnalyticsValidator = [
  param('studentId').trim().notEmpty().withMessage('Student id is required.'),
];

const evaluationIdValidator = [
  param('evaluationId').trim().notEmpty().withMessage('Evaluation id is required.'),
];

module.exports = {
  overviewValidator,
  studentAnalyticsValidator,
  evaluationIdValidator,
};
