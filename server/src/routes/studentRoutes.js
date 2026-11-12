const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  updateStudentStatus,
  resetStudentCredentials,
  deleteStudent,
  exportStudentsCSV
} = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { verifyStudentOwnership } = require('../middleware/ownership');
const { studentValidator } = require('../middleware/validators');

// CSV Export (Admin only)
router.get('/export/csv', authenticate, authorize(['admin']), exportStudentsCSV);

// List all students with search, filters, pagination (Admin only)
router.get('/', authenticate, authorize(['admin']), getStudents);

// Add new student (Admin only)
router.post('/', authenticate, authorize(['admin']), studentValidator, createStudent);

// Get student details (Admin can view any student, Student can view only their own record)
router.get('/:id', authenticate, verifyStudentOwnership('id'), getStudentById);

// Update student (Admin only)
router.put('/:id', authenticate, authorize(['admin']), updateStudent);

// Update student status (Admin only)
router.patch('/:id/status', authenticate, authorize(['admin']), updateStudentStatus);

// Reset student password (Admin only)
router.post('/:id/reset-password', authenticate, authorize(['admin']), resetStudentCredentials);

// Delete student (Admin only)
router.delete('/:id', authenticate, authorize(['admin']), deleteStudent);

module.exports = router;
