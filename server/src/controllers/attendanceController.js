const { Op } = require('sequelize');
const {
  sequelize,
  AttendanceSession,
  AttendanceRecord,
  Student,
  Subject,
  Course,
  Semester,
  Department
} = require('../models');
const { logAudit } = require('../utils/auditLogger');

// Create attendance session and record student attendances
const createSessionWithRecords = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      subject_id,
      semester_id,
      session_date,
      session_time,
      session_type = 'lecture',
      topic,
      conducted_by,
      records
    } = req.body;

    // Check for duplicate session for same subject, date, and session_time
    const existingSession = await AttendanceSession.findOne({
      where: {
        subject_id,
        session_date,
        ...(session_time ? { session_time } : {})
      },
      transaction: t
    });

    if (existingSession) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'An attendance session for this subject, date, and time slot already exists.'
      });
    }

    const session = await AttendanceSession.create({
      subject_id,
      semester_id,
      session_date,
      session_time,
      session_type,
      topic,
      conducted_by: conducted_by || req.user.username
    }, { transaction: t });

    // Validate and insert records
    const attendanceRecordsToCreate = records.map(r => ({
      session_id: session.id,
      student_id: r.student_id,
      status: r.status || 'present',
      remarks: r.remarks || null
    }));

    await AttendanceRecord.bulkCreate(attendanceRecordsToCreate, {
      transaction: t,
      validate: true
    });

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'RECORD_ATTENDANCE_SESSION',
      entity: 'ATTENDANCE_SESSION',
      entityId: session.id,
      newValues: { subject_id, session_date, studentCount: records.length },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Attendance session successfully recorded for ${records.length} students.`,
      session
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Get list of attendance sessions with filters
const getSessions = async (req, res, next) => {
  try {
    const { subject_id, semester_id, date_from, date_to } = req.query;
    const where = {};

    if (subject_id) where.subject_id = subject_id;
    if (semester_id) where.semester_id = semester_id;
    if (date_from || date_to) {
      where.session_date = {};
      if (date_from) where.session_date[Op.gte] = date_from;
      if (date_to) where.session_date[Op.lte] = date_to;
    }

    const sessions = await AttendanceSession.findAll({
      where,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'name'] },
        { model: AttendanceRecord, as: 'records', attributes: ['id', 'status'] }
      ],
      order: [['session_date', 'DESC'], ['created_at', 'DESC']]
    });

    const data = sessions.map(s => {
      const records = s.records || [];
      const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
      return {
        ...s.toJSON(),
        totalStudents: records.length,
        presentCount,
        attendancePercentage: records.length > 0 ? ((presentCount / records.length) * 100).toFixed(1) : 0
      };
    });

    return res.status(200).json({ success: true, sessions: data });
  } catch (error) {
    next(error);
  }
};

// Get single session with all records
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await AttendanceSession.findByPk(id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: Semester, as: 'semester' },
        {
          model: AttendanceRecord,
          as: 'records',
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'student_id', 'first_name', 'last_name', 'email', 'profile_photo']
            }
          ]
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    return res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// Update individual attendance record
const updateAttendanceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const record = await AttendanceRecord.findByPk(id, {
      include: [
        { model: Student, as: 'student', attributes: ['first_name', 'last_name', 'student_id'] }
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const oldStatus = record.status;
    record.status = status;
    if (remarks !== undefined) record.remarks = remarks;
    await record.save();

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_ATTENDANCE_RECORD',
      entity: 'ATTENDANCE_RECORD',
      entityId: record.id,
      oldValues: { status: oldStatus },
      newValues: { status, remarks },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated.',
      record
    });
  } catch (error) {
    next(error);
  }
};

// Get comprehensive attendance report for a student
const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId, {
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: Semester, as: 'currentSemester', attributes: ['name', 'semester_number'] },
        { model: Department, as: 'department', attributes: ['name', 'code'] }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const records = await AttendanceRecord.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: AttendanceSession,
          as: 'session',
          include: [
            { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'type'] },
            { model: Semester, as: 'semester', attributes: ['name'] }
          ]
        }
      ],
      order: [[{ model: AttendanceSession, as: 'session' }, 'session_date', 'DESC']]
    });

    const totalConducted = records.length;
    const totalPresent = records.filter(r => r.status === 'present').length;
    const totalLate = records.filter(r => r.status === 'late').length;
    const totalExcused = records.filter(r => r.status === 'excused').length;
    const totalAbsent = records.filter(r => r.status === 'absent').length;

    // Calculation: present and late are counted as attended
    const attendedSessions = totalPresent + totalLate;
    const overallPercentage = totalConducted > 0
      ? ((attendedSessions / totalConducted) * 100).toFixed(1)
      : '0.0';

    // Subject-wise stats
    const subjectMap = {};
    records.forEach(r => {
      const sub = r.session?.subject;
      if (sub) {
        if (!subjectMap[sub.id]) {
          subjectMap[sub.id] = {
            subjectId: sub.id,
            subjectCode: sub.code,
            subjectName: sub.name,
            subjectType: sub.type,
            conducted: 0,
            present: 0,
            late: 0,
            absent: 0,
            excused: 0
          };
        }
        subjectMap[sub.id].conducted++;
        if (r.status === 'present') subjectMap[sub.id].present++;
        else if (r.status === 'late') subjectMap[sub.id].late++;
        else if (r.status === 'absent') subjectMap[sub.id].absent++;
        else if (r.status === 'excused') subjectMap[sub.id].excused++;
      }
    });

    const subjectWise = Object.values(subjectMap).map(s => {
      const attended = s.present + s.late;
      const percentage = s.conducted > 0 ? ((attended / s.conducted) * 100).toFixed(1) : '0.0';
      return {
        ...s,
        attended,
        percentage,
        isShortage: Number(percentage) < 75
      };
    });

    // Monthly breakdown
    const monthlyMap = {};
    records.forEach(r => {
      const d = r.session?.session_date;
      if (d) {
        const monthKey = d.substring(0, 7); // '2026-03'
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthKey, conducted: 0, attended: 0 };
        }
        monthlyMap[monthKey].conducted++;
        if (r.status === 'present' || r.status === 'late') {
          monthlyMap[monthKey].attended++;
        }
      }
    });

    const monthlyHistory = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        percentage: ((m.attended / m.conducted) * 100).toFixed(1)
      }));

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
        totalConducted,
        attendedSessions,
        totalPresent,
        totalLate,
        totalAbsent,
        totalExcused,
        overallPercentage,
        isShortage: Number(overallPercentage) < 75
      },
      subjectWise,
      monthlyHistory,
      records
    });
  } catch (error) {
    next(error);
  }
};

// General Attendance Reports (with threshold filter & CSV export)
const getAttendanceReports = async (req, res, next) => {
  try {
    const { course_id, semester_id, subject_id, threshold = 75, exportCsv } = req.query;

    const studentWhere = { status: 'active' };
    if (course_id) studentWhere.course_id = course_id;
    if (semester_id) studentWhere.current_semester_id = semester_id;

    const students = await Student.findAll({
      where: studentWhere,
      include: [
        { model: Department, as: 'department', attributes: ['code'] },
        { model: Course, as: 'course', attributes: ['code', 'name'] },
        { model: Semester, as: 'currentSemester', attributes: ['name'] },
        {
          model: AttendanceRecord,
          as: 'attendanceRecords',
          include: [
            {
              model: AttendanceSession,
              as: 'session',
              where: subject_id ? { subject_id } : {},
              attributes: ['session_date', 'subject_id']
            }
          ]
        }
      ]
    });

    const reportData = students.map(st => {
      const records = st.attendanceRecords || [];
      const conducted = records.length;
      const attended = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const pct = conducted > 0 ? ((attended / conducted) * 100).toFixed(1) : '0.0';
      return {
        id: st.id,
        student_id: st.student_id,
        name: `${st.first_name} ${st.last_name}`,
        email: st.email,
        department: st.department?.code,
        course: st.course?.code,
        semester: st.currentSemester?.name,
        conducted,
        attended,
        percentage: pct,
        isBelowThreshold: Number(pct) < Number(threshold)
      };
    });

    if (exportCsv === 'true') {
      const headers = ['Student ID', 'Name', 'Email', 'Department', 'Course', 'Conducted', 'Attended', 'Attendance %', 'Shortage Alert'];
      const rows = reportData.map(r => [
        `"${r.student_id}"`,
        `"${r.name}"`,
        `"${r.email}"`,
        `"${r.department}"`,
        `"${r.course}"`,
        r.conducted,
        r.attended,
        `${r.percentage}%`,
        r.isBelowThreshold ? 'YES (< 75%)' : 'NO'
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      totalStudentsEvaluated: reportData.length,
      threshold: Number(threshold),
      studentsBelowThresholdCount: reportData.filter(r => r.isBelowThreshold).length,
      report: reportData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSessionWithRecords,
  getSessions,
  getSessionById,
  updateAttendanceRecord,
  getStudentAttendance,
  getAttendanceReports
};
