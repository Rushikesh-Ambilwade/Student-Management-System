const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getUserNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.post('/read-all', authenticate, markAllAsRead);

module.exports = router;
