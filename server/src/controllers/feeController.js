const { Op } = require('sequelize');
const crypto = require('crypto');
const {
  sequelize,
  FeeStructure,
  StudentFeeAssessment,
  FeePayment,
  Student,
  Course,
  Semester,
  Department,
  Notification
} = require('../models');
const { logAudit } = require('../utils/auditLogger');

// Generate unique receipt number
function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RCP-${year}-${randomSuffix}`;
}

// --- FEE STRUCTURES ---
const getFeeStructures = async (req, res, next) => {
  try {
    const { course_id, semester_id } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;
    if (semester_id) where.semester_id = semester_id;

    const structures = await FeeStructure.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({ success: true, structures });
  } catch (error) {
    next(error);
  }
};

const createFeeStructure = async (req, res, next) => {
  try {
    const {
      course_id,
      semester_id,
      academic_year,
      category_name = 'Regular',
      tuition_fee = 0,
      lab_fee = 0,
      library_fee = 0,
      exam_fee = 0,
      other_fee = 0,
      due_date
    } = req.body;

    const total_amount = (
      Number(tuition_fee) +
      Number(lab_fee) +
      Number(library_fee) +
      Number(exam_fee) +
      Number(other_fee)
    ).toFixed(2);

    const structure = await FeeStructure.create({
      course_id,
      semester_id,
      academic_year: academic_year || '2025-2026',
      category_name,
      tuition_fee,
      lab_fee,
      library_fee,
      exam_fee,
      other_fee,
      total_amount,
      due_date: due_date || '2026-04-30'
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_FEE_STRUCTURE',
      entity: 'FEE_STRUCTURE',
      entityId: structure.id,
      newValues: { course_id, semester_id, total_amount },
      req
    });

    return res.status(201).json({ success: true, structure });
  } catch (error) {
    next(error);
  }
};

// --- ASSESSMENTS ---
const getFeeAssessments = async (req, res, next) => {
  try {
    const { status, course_id, semester_id, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (semester_id) where.semester_id = semester_id;

    const studentWhere = {};
    if (search && search.trim()) {
      studentWhere[Op.or] = [
        { first_name: { [Op.like]: `%${search.trim()}%` } },
        { last_name: { [Op.like]: `%${search.trim()}%` } },
        { student_id: { [Op.like]: `%${search.trim()}%` } }
      ];
    }
    if (course_id) studentWhere.course_id = course_id;

    const assessments = await StudentFeeAssessment.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
          attributes: ['id', 'student_id', 'first_name', 'last_name', 'email', 'profile_photo'],
          include: [{ model: Course, as: 'course', attributes: ['code', 'name'] }]
        },
        { model: FeeStructure, as: 'feeStructure' },
        { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] },
        { model: FeePayment, as: 'payments' }
      ],
      order: [['due_date', 'ASC']]
    });

    return res.status(200).json({ success: true, assessments });
  } catch (error) {
    next(error);
  }
};

const createFeeAssessment = async (req, res, next) => {
  try {
    const {
      student_id,
      fee_structure_id,
      scholarship_amount = 0,
      concession_amount = 0,
      due_date
    } = req.body;

    const structure = await FeeStructure.findByPk(fee_structure_id);
    if (!structure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found.' });
    }

    const total = Number(structure.total_amount);
    const scholarship = Number(scholarship_amount || 0);
    const concession = Number(concession_amount || 0);
    const net = Math.max(0, total - scholarship - concession);

    const assessment = await StudentFeeAssessment.create({
      student_id,
      fee_structure_id,
      semester_id: structure.semester_id,
      total_amount: total,
      scholarship_amount: scholarship,
      concession_amount: concession,
      net_payable: net,
      paid_amount: 0.00,
      balance_amount: net,
      status: net === 0 ? 'paid' : 'pending',
      due_date: due_date || structure.due_date
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_FEE_ASSESSMENT',
      entity: 'STUDENT_FEE_ASSESSMENT',
      entityId: assessment.id,
      newValues: { student_id, net_payable: net },
      req
    });

    return res.status(201).json({ success: true, assessment });
  } catch (error) {
    next(error);
  }
};

// --- RECORD PAYMENT ---
const recordPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      assessment_id,
      student_id,
      amount_paid,
      payment_date,
      payment_mode = 'online',
      transaction_ref,
      remarks
    } = req.body;

    const amount = Number(amount_paid);
    if (isNaN(amount) || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Valid payment amount greater than 0 is required.' });
    }

    const assessment = await StudentFeeAssessment.findByPk(assessment_id, {
      include: [{ model: Student, as: 'student' }],
      transaction: t
    });

    if (!assessment) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Fee assessment record not found.' });
    }

    if (amount > Number(assessment.balance_amount)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds outstanding balance (${assessment.balance_amount}).`
      });
    }

    const receipt_number = generateReceiptNumber();

    // 1. Create Payment Record
    const payment = await FeePayment.create({
      assessment_id,
      student_id: assessment.student_id,
      receipt_number,
      amount_paid: amount,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      payment_mode,
      transaction_ref: transaction_ref || `TXN_${Date.now()}`,
      remarks: remarks || 'Fee payment recorded',
      collected_by: req.user.username
    }, { transaction: t });

    // 2. Update Assessment Paid & Balance Amounts
    const newPaid = Number(assessment.paid_amount) + amount;
    const newBalance = Math.max(0, Number(assessment.net_payable) - newPaid);
    let newStatus = 'partially_paid';
    if (newBalance <= 0) {
      newStatus = 'paid';
    }

    await assessment.update({
      paid_amount: newPaid.toFixed(2),
      balance_amount: newBalance.toFixed(2),
      status: newStatus
    }, { transaction: t });

    // 3. Create Notification for Student
    if (assessment.student?.user_id) {
      await Notification.create({
        user_id: assessment.student.user_id,
        title: 'Fee Payment Received',
        message: `Payment of $${amount.toFixed(2)} recorded. Receipt #${receipt_number}. Remaining balance: $${newBalance.toFixed(2)}.`,
        type: 'fee',
        link: '/student/fees'
      }, { transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'RECORD_FEE_PAYMENT',
      entity: 'FEE_PAYMENT',
      entityId: payment.id,
      newValues: { receipt_number, amount_paid: amount, balance_remaining: newBalance },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      payment,
      updatedAssessment: {
        paid_amount: newPaid.toFixed(2),
        balance_amount: newBalance.toFixed(2),
        status: newStatus
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// --- STUDENT FEES PORTAL ---
const getStudentFees = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId, {
      include: [
        { model: Department, as: 'department', attributes: ['name', 'code'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: Semester, as: 'currentSemester', attributes: ['name', 'semester_number'] }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const assessments = await StudentFeeAssessment.findAll({
      where: { student_id: studentId },
      include: [
        { model: FeeStructure, as: 'feeStructure' },
        { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] },
        { model: FeePayment, as: 'payments' }
      ],
      order: [['due_date', 'ASC']]
    });

    const allPayments = await FeePayment.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: StudentFeeAssessment,
          as: 'assessment',
          include: [{ model: Semester, as: 'semester', attributes: ['name'] }]
        }
      ],
      order: [['payment_date', 'DESC']]
    });

    let totalAssessed = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let overallStatus = 'paid';

    assessments.forEach(a => {
      totalAssessed += Number(a.net_payable);
      totalPaid += Number(a.paid_amount);
      totalBalance += Number(a.balance_amount);
      if (a.status === 'overdue') overallStatus = 'overdue';
      else if (a.status === 'partially_paid' && overallStatus !== 'overdue') overallStatus = 'partially_paid';
    });

    return res.status(200).json({
      success: true,
      student: {
        id: student.id,
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        department: student.department?.name,
        course: student.course?.name,
        semester: student.currentSemester?.name
      },
      summary: {
        totalAssessed: totalAssessed.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalBalance: totalBalance.toFixed(2),
        overallStatus
      },
      assessments,
      payments: allPayments
    });
  } catch (error) {
    next(error);
  }
};

// Printable receipt details
const getReceiptDetails = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;

    const payment = await FeePayment.findOne({
      where: { receipt_number: receiptNumber },
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            { model: Department, as: 'department', attributes: ['name', 'code'] },
            { model: Course, as: 'course', attributes: ['name', 'code'] },
            { model: Semester, as: 'currentSemester', attributes: ['name'] }
          ]
        },
        {
          model: StudentFeeAssessment,
          as: 'assessment',
          include: [
            { model: FeeStructure, as: 'feeStructure' },
            { model: Semester, as: 'semester', attributes: ['name'] }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    // Security check: If student, verify this receipt belongs to them
    if (req.user.role === 'student' && req.student && payment.student_id !== req.student.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only view your own receipts.' });
    }

    return res.status(200).json({ success: true, receipt: payment });
  } catch (error) {
    next(error);
  }
};

const exportFeesCSV = async (req, res, next) => {
  try {
    const assessments = await StudentFeeAssessment.findAll({
      include: [
        { model: Student, as: 'student', attributes: ['student_id', 'first_name', 'last_name', 'email'] },
        { model: Semester, as: 'semester', attributes: ['name'] },
        { model: FeeStructure, as: 'feeStructure', attributes: ['category_name'] }
      ],
      order: [['due_date', 'ASC']]
    });

    const headers = ['Student ID', 'Student Name', 'Semester', 'Category', 'Total Amount', 'Scholarship', 'Net Payable', 'Paid Amount', 'Balance', 'Status', 'Due Date'];
    const rows = assessments.map(a => [
      `"${a.student?.student_id}"`,
      `"${a.student?.first_name} ${a.student?.last_name}"`,
      `"${a.semester?.name}"`,
      `"${a.feeStructure?.category_name}"`,
      a.total_amount,
      a.scholarship_amount,
      a.net_payable,
      a.paid_amount,
      a.balance_amount,
      `"${a.status}"`,
      `"${a.due_date}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fee_assessments_report.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  getFeeAssessments,
  createFeeAssessment,
  recordPayment,
  getStudentFees,
  getReceiptDetails,
  exportFeesCSV
};
