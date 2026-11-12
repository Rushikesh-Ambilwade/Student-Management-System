const express = require('express');
const router = express.Router();
const { getAdminDashboard, getStudentDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/admin', authenticate, authorize(['admin']), getAdminDashboard);
router.get('/student', authenticate, authorize(['student']), getStudentDashboard);

module.exports = router;
