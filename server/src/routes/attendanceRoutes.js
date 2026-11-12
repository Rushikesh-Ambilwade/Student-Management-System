const express = require('express');
const router = express.Router();
const {
  createSessionWithRecords,
  getSessions,
  getSessionById,
  updateAttendanceRecord,
  getStudentAttendance,
  getAttendanceReports
} = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { verifyStudentOwnership } = require('../middleware/ownership');
const { attendanceSessionValidator } = require('../middleware/validators');

// Admin: Attendance Reports with shortage filter & CSV export
router.get('/reports', authenticate, authorize(['admin']), getAttendanceReports);

// Admin: Record new attendance session
router.post('/sessions', authenticate, authorize(['admin']), attendanceSessionValidator, createSessionWithRecords);

// Admin: List sessions
router.get('/sessions', authenticate, authorize(['admin']), getSessions);

// Admin: Get single session details with records
router.get('/sessions/:id', authenticate, authorize(['admin']), getSessionById);

// Admin: Update individual record
router.put('/records/:id', authenticate, authorize(['admin']), updateAttendanceRecord);

// Student/Admin: View student attendance (ownership enforced)
router.get('/student/:studentId', authenticate, verifyStudentOwnership('studentId'), getStudentAttendance);

module.exports = router;
