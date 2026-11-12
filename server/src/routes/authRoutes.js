const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginValidator, changePasswordValidator } = require('../middleware/validators');

// Rate limiting on sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

router.post('/login', authLimiter, loginValidator, login);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePasswordValidator, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/logout', authenticate, logout);

module.exports = router;
