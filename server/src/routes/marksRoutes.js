const express = require('express');
const router = express.Router();
const {
  getExaminations,
  createExamination,
  updateExamination,
  getExamSubjectMarks,
  batchEnterMarks,
  getStudentMarks,
  exportResultsCSV
} = require('../controllers/marksController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { verifyStudentOwnership } = require('../middleware/ownership');
const { marksBatchValidator } = require('../middleware/validators');

// Exams list (Admin & Student)
router.get('/examinations', authenticate, getExaminations);

// Create examination (Admin only)
router.post('/examinations', authenticate, authorize(['admin']), createExamination);

// Update examination (Admin only)
router.put('/examinations/:id', authenticate, authorize(['admin']), updateExamination);

// Marks Sheet for Subject & Exam (Admin only)
router.get('/sheet', authenticate, authorize(['admin']), getExamSubjectMarks);

// Enter / Update Marks Batch (Admin only)
router.post('/batch', authenticate, authorize(['admin']), marksBatchValidator, batchEnterMarks);

// Export results to CSV (Admin only)
router.get('/export/csv', authenticate, authorize(['admin']), exportResultsCSV);

// Student Result Card (Admin or Student - Ownership enforced)
router.get('/student/:studentId', authenticate, verifyStudentOwnership('studentId'), getStudentMarks);

module.exports = router;
