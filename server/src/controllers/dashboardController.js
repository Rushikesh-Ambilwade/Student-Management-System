const { Op } = require('sequelize');
const {
  Student,
  User,
  Department,
  Course,
  Semester,
  Subject,
  AttendanceRecord,
  AttendanceSession,
  Examination,
  Mark,
  StudentFeeAssessment,
  FeePayment,
  Announcement,
  AuditLog,
  Timetable
} = require('../models');

const getAdminDashboard = async (req, res, next) => {
  try {
    // 1. High-level metric counts
    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ where: { status: 'active' } });
    const totalDepartments = await Department.count({ where: { is_active: true } });
    const totalCourses = await Course.count({ where: { is_active: true } });
    const totalSubjects = await Subject.count({ where: { is_active: true } });

    // 2. Average Attendance Percentage across all sessions
    const totalAttendanceRecords = await AttendanceRecord.count();
    const presentAttendanceRecords = await AttendanceRecord.count({
      where: {
        status: { [Op.in]: ['present', 'late'] }
      }
    });
    const avgAttendance = totalAttendanceRecords > 0
      ? ((presentAttendanceRecords / totalAttendanceRecords) * 100).toFixed(1)
      : 0;

    // 3. Fee summary
    const assessments = await StudentFeeAssessment.findAll();
    let totalAssessed = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let overdueCount = 0;

    assessments.forEach(a => {
      totalAssessed += Number(a.net_payable || 0);
      totalCollected += Number(a.paid_amount || 0);
      totalPending += Number(a.balance_amount || 0);
      if (a.status === 'overdue') overdueCount++;
    });

    // 4. Upcoming Examinations
    const today = new Date().toISOString().split('T')[0];
    const upcomingExams = await Examination.findAll({
      where: {
        end_date: { [Op.gte]: today }
      },
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ],
      order: [['start_date', 'ASC']],
      limit: 5
    });

    // 5. Recent Student Registrations
    const recentStudents = await Student.findAll({
      include: [
        { model: Department, as: 'department', attributes: ['name', 'code'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // 6. Students with Low Attendance (< 75%)
    // Group records by student
    const allStudents = await Student.findAll({
      where: { status: 'active' },
      attributes: ['id', 'student_id', 'first_name', 'last_name', 'email'],
      include: [
        { model: Department, as: 'department', attributes: ['code'] },
        { model: Course, as: 'course', attributes: ['code'] },
        {
          model: AttendanceRecord,
          as: 'attendanceRecords',
          attributes: ['status']
        }
      ]
    });

    const lowAttendanceStudents = [];
    allStudents.forEach(st => {
      const records = st.attendanceRecords || [];
      if (records.length > 0) {
        const attended = records.filter(r => r.status === 'present' || r.status === 'late').length;
        const pct = ((attended / records.length) * 100).toFixed(1);
        if (Number(pct) < 75) {
          lowAttendanceStudents.push({
            id: st.id,
            student_id: st.student_id,
            name: `${st.first_name} ${st.last_name}`,
            email: st.email,
            department: st.department ? st.department.code : '-',
            course: st.course ? st.course.code : '-',
            totalSessions: records.length,
            attendedSessions: attended,
            percentage: pct
          });
        }
      }
    });

    // 7. Charts Data
    // Enrollment by Department
    const depts = await Department.findAll({
      include: [{ model: Student, as: 'students', attributes: ['id'] }]
    });
    const enrollmentByDept = depts.map(d => ({
      name: d.code,
      department: d.name,
      students: d.students ? d.students.length : 0
    }));

    // Academic Performance Distribution
    const marks = await Mark.findAll({ attributes: ['grade', 'marks_obtained', 'max_marks'] });
    const gradeCounts = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0, 'AB': 0 };
    marks.forEach(m => {
      if (m.grade && gradeCounts[m.grade] !== undefined) {
        gradeCounts[m.grade]++;
      }
    });
    const performanceChart = Object.keys(gradeCounts).map(g => ({
      grade: g,
      count: gradeCounts[g]
    }));

    // Fee Overview Chart
    const feeOverviewChart = [
      { name: 'Collected', amount: Number(totalCollected.toFixed(2)) },
      { name: 'Pending Balance', amount: Number(totalPending.toFixed(2)) }
    ];

    // Recent System Activity
    const recentActivity = await AuditLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 6,
      include: [
        { model: User, as: 'user', attributes: ['username', 'role'] }
      ]
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalDepartments,
        totalCourses,
        totalSubjects,
        avgAttendance,
        totalAssessed: totalAssessed.toFixed(2),
        totalCollected: totalCollected.toFixed(2),
        totalPending: totalPending.toFixed(2),
        overdueCount
      },
      charts: {
        enrollmentByDept,
        performanceChart,
        feeOverviewChart
      },
      upcomingExams,
      recentStudents,
      lowAttendanceStudents,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

const getStudentDashboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.id },
      include: [
        { model: Department, as: 'department' },
        { model: Course, as: 'course' },
        { model: Semester, as: 'currentSemester' }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not linked to this account.'
      });
    }

    // 1. Attendance Summary
    const attendanceRecords = await AttendanceRecord.findAll({
      where: { student_id: student.id },
      include: [
        {
          model: AttendanceSession,
          as: 'session',
          include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }]
        }
      ]
    });

    const totalSessions = attendanceRecords.length;
    const attendedSessions = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const overallAttendance = totalSessions > 0
      ? ((attendedSessions / totalSessions) * 100).toFixed(1)
      : '0.0';

    // Subject-wise breakdown
    const subjectMap = {};
    attendanceRecords.forEach(r => {
      const sub = r.session?.subject;
      if (sub) {
        if (!subjectMap[sub.id]) {
          subjectMap[sub.id] = {
            id: sub.id,
            name: sub.name,
            code: sub.code,
            total: 0,
            attended: 0
          };
        }
        subjectMap[sub.id].total++;
        if (r.status === 'present' || r.status === 'late') {
          subjectMap[sub.id].attended++;
        }
      }
    });

    const subjectWiseAttendance = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: s.total > 0 ? ((s.attended / s.total) * 100).toFixed(1) : '0.0'
    }));

    // 2. Marks & Academic Performance
    const marks = await Mark.findAll({
      where: { student_id: student.id },
      include: [
        { model: Subject, as: 'subject', attributes: ['name', 'code', 'credits'] },
        { model: Examination, as: 'examination', attributes: ['name', 'exam_type'] }
      ]
    });

    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    marks.forEach(m => {
      if (!m.is_absent) {
        totalMarksObtained += Number(m.marks_obtained);
      }
      totalMaxMarks += Number(m.max_marks);
    });

    const overallPercentage = totalMaxMarks > 0
      ? ((totalMarksObtained / totalMaxMarks) * 100).toFixed(1)
      : '0.0';

    // 3. Fee Assessment & Payments
    const feeAssessments = await StudentFeeAssessment.findAll({
      where: { student_id: student.id }
    });

    let totalFees = 0;
    let paidFees = 0;
    let outstandingFees = 0;
    let feeStatus = 'paid';

    feeAssessments.forEach(fa => {
      totalFees += Number(fa.net_payable);
      paidFees += Number(fa.paid_amount);
      outstandingFees += Number(fa.balance_amount);
      if (fa.status === 'overdue') feeStatus = 'overdue';
      else if (fa.status === 'partially_paid' && feeStatus !== 'overdue') feeStatus = 'partially_paid';
    });

    // 4. Today's Classes from Timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[new Date().getDay()];
    const todayClasses = await Timetable.findAll({
      where: {
        course_id: student.course_id,
        semester_id: student.current_semester_id,
        day_of_week: todayDay === 'Sunday' ? 'Monday' : todayDay
      },
      include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
      order: [['start_time', 'ASC']]
    });

    // 5. Active Announcements
    const announcements = await Announcement.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { target_type: 'all' },
          { target_type: 'department', target_id: student.department_id },
          { target_type: 'course', target_id: student.course_id },
          { target_type: 'semester', target_id: student.current_semester_id },
          { target_type: 'student', target_id: student.id }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 4
    });

    return res.status(200).json({
      success: true,
      profile: {
        id: student.id,
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        department: student.department?.name,
        course: student.course?.name,
        semester: student.currentSemester?.name,
        profile_photo: student.profile_photo,
        status: student.status
      },
      attendance: {
        totalSessions,
        attendedSessions,
        overallAttendance,
        isShortage: Number(overallAttendance) < 75,
        subjectWise: subjectWiseAttendance
      },
      academics: {
        overallPercentage,
        totalSubjects: marks.length,
        recentMarks: marks.slice(0, 5)
      },
      fees: {
        totalFees: totalFees.toFixed(2),
        paidFees: paidFees.toFixed(2),
        outstandingFees: outstandingFees.toFixed(2),
        status: feeStatus
      },
      todaySchedule: {
        day: todayDay === 'Sunday' ? 'Monday' : todayDay,
        classes: todayClasses
      },
      announcements
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getStudentDashboard
};
