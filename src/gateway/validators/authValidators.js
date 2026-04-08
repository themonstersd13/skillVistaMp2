const { body } = require('express-validator');
const { USER_ROLES } = require('../../config/constants');

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.'),
  body('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage('Role must be one of admin, faculty, or student.'),
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = {
  registerValidator,
  loginValidator,
};
