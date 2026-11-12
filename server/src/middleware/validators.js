const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please verify your input.',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const loginValidator = [
  body('usernameOrEmail')
    .trim()
    .notEmpty()
    .withMessage('Username or Email is required.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  validate
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long.'),
  validate
];

const studentValidator = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required.')
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters.'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.')
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required.'),
  body('department_id')
    .isInt({ min: 1 })
    .withMessage('A valid department ID is required.'),
  body('course_id')
    .isInt({ min: 1 })
    .withMessage('A valid course ID is required.'),
  body('current_semester_id')
    .isInt({ min: 1 })
    .withMessage('A valid semester ID is required.'),
  body('admission_date')
    .isISO8601()
    .withMessage('A valid admission date (YYYY-MM-DD) is required.'),
  validate
];

const marksBatchValidator = [
  body('examination_id')
    .isInt({ min: 1 })
    .withMessage('Valid examination ID is required.'),
  body('subject_id')
    .isInt({ min: 1 })
    .withMessage('Valid subject ID is required.'),
  body('marks')
    .isArray({ min: 1 })
    .withMessage('Marks array must contain at least one entry.'),
  body('marks.*.student_id')
    .isInt({ min: 1 })
    .withMessage('Valid student_id is required for each mark entry.'),
  body('marks.*.marks_obtained')
    .custom((val, { req }) => {
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        throw new Error('Marks obtained cannot be negative or invalid.');
      }
      return true;
    }),
  validate
];

const attendanceSessionValidator = [
  body('subject_id')
    .isInt({ min: 1 })
    .withMessage('Valid subject ID is required.'),
  body('semester_id')
    .isInt({ min: 1 })
    .withMessage('Valid semester ID is required.'),
  body('session_date')
    .isISO8601()
    .withMessage('Valid session date (YYYY-MM-DD) is required.'),
  body('records')
    .isArray({ min: 1 })
    .withMessage('Attendance records array must not be empty.'),
  body('records.*.student_id')
    .isInt({ min: 1 })
    .withMessage('Valid student ID required for each record.'),
  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Attendance status must be present, absent, late, or excused.'),
  validate
];

const feePaymentValidator = [
  body('assessment_id')
    .isInt({ min: 1 })
    .withMessage('Valid fee assessment ID is required.'),
  body('student_id')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required.'),
  body('amount_paid')
    .isFloat({ min: 0.01 })
    .withMessage('Amount paid must be greater than zero.'),
  body('payment_mode')
    .isIn(['cash', 'bank_transfer', 'online', 'cheque', 'upi'])
    .withMessage('Payment mode must be cash, bank_transfer, online, cheque, or upi.'),
  body('payment_date')
    .isISO8601()
    .withMessage('Valid payment date is required.'),
  validate
];

module.exports = {
  validate,
  loginValidator,
  changePasswordValidator,
  studentValidator,
  marksBatchValidator,
  attendanceSessionValidator,
  feePaymentValidator
};
