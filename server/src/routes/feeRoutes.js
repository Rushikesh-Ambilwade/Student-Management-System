const express = require('express');
const router = express.Router();
const {
  getFeeStructures,
  createFeeStructure,
  getFeeAssessments,
  createFeeAssessment,
  recordPayment,
  getStudentFees,
  getReceiptDetails,
  exportFeesCSV
} = require('../controllers/feeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { verifyStudentOwnership } = require('../middleware/ownership');
const { feePaymentValidator } = require('../middleware/validators');

// Fee structures
router.get('/structures', authenticate, getFeeStructures);
router.post('/structures', authenticate, authorize(['admin']), createFeeStructure);

// Fee assessments & reports (Admin only)
router.get('/assessments', authenticate, authorize(['admin']), getFeeAssessments);
router.post('/assessments', authenticate, authorize(['admin']), createFeeAssessment);
router.get('/export/csv', authenticate, authorize(['admin']), exportFeesCSV);

// Record payment (Admin only)
router.post('/payments', authenticate, authorize(['admin']), feePaymentValidator, recordPayment);

// Printable receipt details
router.get('/receipt/:receiptNumber', authenticate, getReceiptDetails);

// Student fee records (ownership verified)
router.get('/student/:studentId', authenticate, verifyStudentOwnership('studentId'), getStudentFees);

module.exports = router;
