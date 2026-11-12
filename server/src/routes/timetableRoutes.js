const express = require('express');
const router = express.Router();
const {
  getTimetables,
  getStudentTimetable,
  createTimetableSlot,
  deleteTimetableSlot
} = require('../controllers/timetableController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Student personalized timetable
router.get('/my-schedule', authenticate, authorize(['student']), getStudentTimetable);

// General timetables list (Admin & Student)
router.get('/', authenticate, getTimetables);

// Admin: Add timetable slot with conflict checks
router.post('/', authenticate, authorize(['admin']), createTimetableSlot);

// Admin: Delete slot
router.delete('/:id', authenticate, authorize(['admin']), deleteTimetableSlot);

module.exports = router;
