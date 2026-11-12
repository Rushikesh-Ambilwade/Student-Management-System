const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const {
  sequelize,
  Student,
  User,
  Department,
  Course,
  Semester,
  AttendanceRecord,
  AttendanceSession,
  Subject,
  Mark,
  Examination,
  StudentFeeAssessment,
  FeePayment
} = require('../models');
const { logAudit } = require('../utils/auditLogger');

const getStudents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department_id,
      course_id,
      semester_id,
      status,
      academic_year,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (search.trim()) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search.trim()}%` } },
        { last_name: { [Op.like]: `%${search.trim()}%` } },
        { student_id: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    if (department_id) where.department_id = department_id;
    if (course_id) where.course_id = course_id;
    if (semester_id) where.current_semester_id = semester_id;
    if (status) where.status = status;
    if (academic_year) where.academic_year = academic_year;

    const validSortFields = ['first_name', 'last_name', 'student_id', 'email', 'created_at', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Student.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortField, sortOrder]],
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'currentSemester', attributes: ['id', 'name', 'semester_number'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'is_active', 'last_login'] }
      ]
    });

    return res.status(200).json({
      success: true,
      students: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        { model: Department, as: 'department' },
        { model: Course, as: 'course' },
        { model: Semester, as: 'currentSemester' },
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'is_active', 'last_login'] },
        {
          model: AttendanceRecord,
          as: 'attendanceRecords',
          include: [
            {
              model: AttendanceSession,
              as: 'session',
              include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }]
            }
          ]
        },
        {
          model: Mark,
          as: 'marks',
          include: [
            { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits'] },
            { model: Examination, as: 'examination', attributes: ['id', 'name', 'exam_type'] }
          ]
        },
        {
          model: StudentFeeAssessment,
          as: 'feeAssessments',
          include: [
            { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] },
            { model: FeePayment, as: 'payments' }
          ]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    // Calculate aggregated attendance percentage
    const records = student.attendanceRecords || [];
    const totalSessions = records.length;
    const attendedSessions = records.filter(r => r.status === 'present' || r.status === 'late').length;
    const attendancePercentage = totalSessions > 0
      ? ((attendedSessions / totalSessions) * 100).toFixed(1)
      : '0.0';

    return res.status(200).json({
      success: true,
      student,
      metrics: {
        totalSessions,
        attendedSessions,
        attendancePercentage,
        isAttendanceShortage: Number(attendancePercentage) < 75
      }
    });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      student_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      profile_photo,
      department_id,
      course_id,
      academic_year,
      current_semester_id,
      admission_date,
      status = 'active',
      emergency_contact_name,
      emergency_contact_phone,
      initialPassword = 'Student@12345'
    } = req.body;

    // Check for existing user or student
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username: student_id }
        ]
      },
      transaction: t
    });

    if (existingUser) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'A user with this email or Student ID already exists.'
      });
    }

    // 1. Create User account
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(initialPassword, salt);

    const user = await User.create({
      username: student_id,
      email,
      password_hash,
      role: 'student',
      is_active: status === 'active'
    }, { transaction: t });

    // 2. Create Student record
    const student = await Student.create({
      user_id: user.id,
      student_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      profile_photo: profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(first_name + ' ' + last_name)}&background=0D8ABC&color=fff`,
      department_id,
      course_id,
      academic_year: academic_year || '2025-2026',
      current_semester_id,
      admission_date,
      status,
      emergency_contact_name,
      emergency_contact_phone
    }, { transaction: t });

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_STUDENT',
      entity: 'STUDENT',
      entityId: student.id,
      newValues: { student_id, email, name: `${first_name} ${last_name}` },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      student,
      initialCredentials: {
        username: student_id,
        temporaryPassword: initialPassword
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id, { transaction: t });

    if (!student) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Student record not found.'
      });
    }

    const oldValues = student.toJSON();

    const allowedFields = [
      'first_name', 'last_name', 'phone', 'date_of_birth', 'gender',
      'address', 'profile_photo', 'department_id', 'course_id',
      'academic_year', 'current_semester_id', 'status',
      'emergency_contact_name', 'emergency_contact_phone'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    await student.save({ transaction: t });

    // Sync user status if student status changed
    if (req.body.status) {
      await User.update(
        { is_active: req.body.status === 'active' },
        { where: { id: student.user_id }, transaction: t }
      );
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_STUDENT',
      entity: 'STUDENT',
      entityId: student.id,
      oldValues,
      newValues: student.toJSON(),
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Student information updated successfully.',
      student
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updateStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'graduated', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Allowed: active, graduated, suspended, inactive.'
      });
    }

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const oldStatus = student.status;
    student.status = status;
    await student.save();

    await User.update(
      { is_active: status === 'active' },
      { where: { id: student.user_id } }
    );

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_STUDENT_STATUS',
      entity: 'STUDENT',
      entityId: student.id,
      oldValues: { status: oldStatus },
      newValues: { status },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Student status successfully updated to '${status}'.`,
      student
    });
  } catch (error) {
    next(error);
  }
};

const resetStudentCredentials = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const user = await User.findByPk(student.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Associated user account not found.'
      });
    }

    const temporaryPassword = newPassword || 'Student@12345';
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(temporaryPassword, salt);
    await user.save();

    await logAudit({
      userId: req.user.id,
      action: 'RESET_STUDENT_PASSWORD',
      entity: 'USER',
      entityId: user.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${student.first_name} ${student.last_name}.`,
      credentials: {
        username: user.username,
        temporaryPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id, { transaction: t });

    if (!student) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const userId = student.user_id;
    await student.destroy({ transaction: t });
    await User.destroy({ where: { id: userId }, transaction: t });

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_STUDENT',
      entity: 'STUDENT',
      entityId: id,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Student and corresponding user account permanently deleted.'
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const exportStudentsCSV = async (req, res, next) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: Department, as: 'department', attributes: ['code', 'name'] },
        { model: Course, as: 'course', attributes: ['code', 'name'] },
        { model: Semester, as: 'currentSemester', attributes: ['semester_number', 'name'] }
      ],
      order: [['student_id', 'ASC']]
    });

    const headers = [
      'Student ID', 'First Name', 'Last Name', 'Email', 'Phone',
      'Gender', 'Department', 'Course', 'Semester', 'Academic Year',
      'Status', 'Admission Date'
    ];

    const rows = students.map(s => [
      `"${s.student_id}"`,
      `"${s.first_name}"`,
      `"${s.last_name}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.gender}"`,
      `"${s.department ? s.department.code : ''}"`,
      `"${s.course ? s.course.code : ''}"`,
      `"${s.currentSemester ? s.currentSemester.name : ''}"`,
      `"${s.academic_year}"`,
      `"${s.status}"`,
      `"${s.admission_date}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  updateStudentStatus,
  resetStudentCredentials,
  deleteStudent,
  exportStudentsCSV
};
