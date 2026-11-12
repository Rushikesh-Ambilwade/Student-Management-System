const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

async function runTests() {
  console.log('🧪 Starting Student Management System API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request(app).get('/api/health');
    assert(health.status === 200 && health.body.status === 'healthy', 'Health check endpoint returns 200 and healthy status');

    // 2. Admin Authentication
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'admin@college.edu', password: 'Admin@12345' });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin login succeeds with valid credentials');
    const adminToken = adminLogin.body.token;

    // 3. Invalid credentials rejection
    const invalidLogin = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'admin@college.edu', password: 'WrongPassword' });
    assert(invalidLogin.status === 401 && invalidLogin.body.success === false, 'Login rejects incorrect password with 401');

    // 4. Student Authentication
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'CS2026001', password: 'Student@12345' });
    assert(studentLogin.status === 200 && studentLogin.body.user.role === 'student', 'Student login succeeds and role is student');
    const student1Token = studentLogin.body.token;
    const student1Id = studentLogin.body.user.studentProfile.id;

    // 5. Admin can list students
    const studentList = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(studentList.status === 200 && studentList.body.students.length > 0, 'Admin can view paginated students list');
    const student2 = studentList.body.students.find(s => s.id !== student1Id);
    const student2Id = student2.id;

    // 6. RBAC: Student blocked from accessing admin student list
    const studentForbidden = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${student1Token}`);
    assert(studentForbidden.status === 403, 'RBAC: Student forbidden (403) from accessing admin student management list');

    // 7. Data Isolation / IDOR: Student can access own attendance
    const ownAttendance = await request(app)
      .get(`/api/attendance/student/${student1Id}`)
      .set('Authorization', `Bearer ${student1Token}`);
    assert(ownAttendance.status === 200 && ownAttendance.body.summary, 'Student can view their own attendance summary');

    // 8. Data Isolation / IDOR: Student BLOCKED from accessing another student attendance
    const otherAttendance = await request(app)
      .get(`/api/attendance/student/${student2Id}`)
      .set('Authorization', `Bearer ${student1Token}`);
    assert(otherAttendance.status === 403, 'IDOR Protection: Student blocked (403) from accessing another student attendance');

    // 9. Data Isolation / IDOR: Student BLOCKED from accessing another student fees
    const otherFees = await request(app)
      .get(`/api/fees/student/${student2Id}`)
      .set('Authorization', `Bearer ${student1Token}`);
    assert(otherFees.status === 403, 'IDOR Protection: Student blocked (403) from accessing another student fees');

    // 10. Marks Validation: Reject marks > max_marks
    const invalidMarks = await request(app)
      .post('/api/marks/batch')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examination_id: 1,
        subject_id: 1,
        max_marks: 100,
        passing_marks: 40,
        marks: [{ student_id: student1Id, marks_obtained: 150 }]
      });
    assert(invalidMarks.status === 400, 'Marks Validation: Rejects marks obtained exceeding maximum marks');

    // 11. Duplicate attendance session prevention
    const uniqueTime = 'TestSlot_' + Date.now();
    const session1 = await request(app)
      .post('/api/attendance/sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject_id: 1,
        semester_id: 4,
        session_date: '2026-06-01',
        session_time: uniqueTime,
        session_type: 'lecture',
        topic: 'Graph Theory & Network Flows',
        records: [{ student_id: student1Id, status: 'present' }]
      });
    assert(session1.status === 201, 'Attendance: Creates valid attendance session');

    const duplicateSession = await request(app)
      .post('/api/attendance/sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject_id: 1,
        semester_id: 4,
        session_date: '2026-06-01',
        session_time: uniqueTime,
        session_type: 'lecture',
        topic: 'Duplicate Attempt',
        records: [{ student_id: student1Id, status: 'present' }]
      });
    assert(duplicateSession.status === 409, 'Attendance: Blocks duplicate session creation with 409 Conflict');

    // 12. Admin Dashboard Metrics verification
    const adminDash = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDash.status === 200 && Number(adminDash.body.stats.totalStudents) > 0, 'Admin Dashboard returns calculated database metrics');

    // 13. Student Dashboard Metrics verification
    const studentDash = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${student1Token}`);
    assert(studentDash.status === 200 && studentDash.body.profile.student_id === 'CS2026001', 'Student Dashboard returns personalized profile and stats');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    await sequelize.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    await sequelize.close();
    process.exit(1);
  }
}

runTests();
