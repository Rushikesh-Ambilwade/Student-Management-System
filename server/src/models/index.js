const { sequelize } = require('../config/database');
const User = require('./User');
const Department = require('./Department');
const Course = require('./Course');
const Semester = require('./Semester');
const Subject = require('./Subject');
const Student = require('./Student');
const AttendanceSession = require('./AttendanceSession');
const AttendanceRecord = require('./AttendanceRecord');
const Examination = require('./Examination');
const Mark = require('./Mark');
const FeeStructure = require('./FeeStructure');
const StudentFeeAssessment = require('./StudentFeeAssessment');
const FeePayment = require('./FeePayment');
const Timetable = require('./Timetable');
const Announcement = require('./Announcement');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');

// 1. User <-> Student
User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 2. Department <-> Course
Department.hasMany(Course, { foreignKey: 'department_id', as: 'courses' });
Course.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// 3. Department <-> Student
Department.hasMany(Student, { foreignKey: 'department_id', as: 'students' });
Student.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// 4. Course <-> Semester
Course.hasMany(Semester, { foreignKey: 'course_id', as: 'semesters', onDelete: 'CASCADE' });
Semester.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// 5. Course <-> Subject
Course.hasMany(Subject, { foreignKey: 'course_id', as: 'subjects' });
Subject.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// 6. Semester <-> Subject
Semester.hasMany(Subject, { foreignKey: 'semester_id', as: 'subjects' });
Subject.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

// 7. Course <-> Student
Course.hasMany(Student, { foreignKey: 'course_id', as: 'students' });
Student.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// 8. Semester <-> Student
Semester.hasMany(Student, { foreignKey: 'current_semester_id', as: 'students' });
Student.belongsTo(Semester, { foreignKey: 'current_semester_id', as: 'currentSemester' });

// 9. Subject & Semester <-> AttendanceSession
Subject.hasMany(AttendanceSession, { foreignKey: 'subject_id', as: 'attendanceSessions', onDelete: 'CASCADE' });
AttendanceSession.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Semester.hasMany(AttendanceSession, { foreignKey: 'semester_id', as: 'attendanceSessions', onDelete: 'CASCADE' });
AttendanceSession.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

// 10. AttendanceSession & Student <-> AttendanceRecord
AttendanceSession.hasMany(AttendanceRecord, { foreignKey: 'session_id', as: 'records', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(AttendanceSession, { foreignKey: 'session_id', as: 'session' });

Student.hasMany(AttendanceRecord, { foreignKey: 'student_id', as: 'attendanceRecords', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// 11. Examination <-> Course, Semester, Mark
Course.hasMany(Examination, { foreignKey: 'course_id', as: 'examinations' });
Examination.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Semester.hasMany(Examination, { foreignKey: 'semester_id', as: 'examinations' });
Examination.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

Examination.hasMany(Mark, { foreignKey: 'examination_id', as: 'marks', onDelete: 'CASCADE' });
Mark.belongsTo(Examination, { foreignKey: 'examination_id', as: 'examination' });

Subject.hasMany(Mark, { foreignKey: 'subject_id', as: 'marks', onDelete: 'CASCADE' });
Mark.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Student.hasMany(Mark, { foreignKey: 'student_id', as: 'marks', onDelete: 'CASCADE' });
Mark.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// 12. Fee Structures & Assessments & Payments
Course.hasMany(FeeStructure, { foreignKey: 'course_id', as: 'feeStructures' });
FeeStructure.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Semester.hasMany(FeeStructure, { foreignKey: 'semester_id', as: 'feeStructures' });
FeeStructure.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

FeeStructure.hasMany(StudentFeeAssessment, { foreignKey: 'fee_structure_id', as: 'assessments' });
StudentFeeAssessment.belongsTo(FeeStructure, { foreignKey: 'fee_structure_id', as: 'feeStructure' });

Student.hasMany(StudentFeeAssessment, { foreignKey: 'student_id', as: 'feeAssessments', onDelete: 'CASCADE' });
StudentFeeAssessment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Semester.hasMany(StudentFeeAssessment, { foreignKey: 'semester_id', as: 'feeAssessments' });
StudentFeeAssessment.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

StudentFeeAssessment.hasMany(FeePayment, { foreignKey: 'assessment_id', as: 'payments', onDelete: 'CASCADE' });
FeePayment.belongsTo(StudentFeeAssessment, { foreignKey: 'assessment_id', as: 'assessment' });

Student.hasMany(FeePayment, { foreignKey: 'student_id', as: 'feePayments', onDelete: 'CASCADE' });
FeePayment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// 13. Timetables
Course.hasMany(Timetable, { foreignKey: 'course_id', as: 'timetables' });
Timetable.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Semester.hasMany(Timetable, { foreignKey: 'semester_id', as: 'timetables' });
Timetable.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });

Subject.hasMany(Timetable, { foreignKey: 'subject_id', as: 'timetables', onDelete: 'CASCADE' });
Timetable.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// 14. Notifications & Audit
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Department,
  Course,
  Semester,
  Subject,
  Student,
  AttendanceSession,
  AttendanceRecord,
  Examination,
  Mark,
  FeeStructure,
  StudentFeeAssessment,
  FeePayment,
  Timetable,
  Announcement,
  Notification,
  AuditLog
};
