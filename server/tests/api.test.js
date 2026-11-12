const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

describe('Student Management System - Backend Integration & Security Tests', () => {
  let adminToken;
  let student1Token;
  let student1Id;
  let student2Id;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: 'admin@college.edu',
        password: 'Admin@12345'
      });
    expect(adminLoginRes.status).toBe(200);
    expect(adminLoginRes.body.token).toBeDefined();
    adminToken = adminLoginRes.body.token;

    // 2. Authenticate Student (Rahul Sharma - CS2026001)
    const studentLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: 'CS2026001',
        password: 'Student@12345'
      });
    expect(studentLoginRes.status).toBe(200);
    expect(studentLoginRes.body.token).toBeDefined();
    student1Token = studentLoginRes.body.token;
    student1Id = studentLoginRes.body.user.studentProfile.id;

    // Find student 2 (Priya Patel or another student) to test isolation
    const studentListRes = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${adminToken}`);
    const student2 = studentListRes.body.students.find(s => s.id !== student1Id);
    student2Id = student2.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // --- AUTHENTICATION TESTS ---
  describe('Authentication Suite', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'admin@college.edu',
          password: 'WrongPassword@999'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with nonexistent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'nonexistent@college.edu',
          password: 'Password123'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully retrieve authenticated user profile with /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
    });
  });

  // --- ROLE-BASED ACCESS CONTROL (RBAC) TESTS ---
  describe('RBAC & Authorization Suite', () => {
    it('should allow admin to access student management list', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.students).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
    });

    it('should block student from accessing admin student management list (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should block unauthenticated requests to protected endpoints (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin');
      expect(res.status).toBe(401);
    });
  });

  // --- STUDENT HORIZONTAL PRIVILEGE ESCALATION (IDOR) TESTS ---
  describe('Student Data Isolation & Ownership Suite', () => {
    it('should allow student to access their own attendance records', async () => {
      const res = await request(app)
        .get(`/api/attendance/student/${student1Id}`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
    });

    it('should BLOCK student from accessing another student attendance records (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/attendance/student/${student2Id}`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow student to access their own fee records', async () => {
      const res = await request(app)
        .get(`/api/fees/student/${student1Id}`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
    });

    it('should BLOCK student from accessing another student fee records (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/fees/student/${student2Id}`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // --- VALIDATION & BUSINESS LOGIC TESTS ---
  describe('Marks & Attendance Business Validation Suite', () => {
    it('should reject marks greater than maximum marks', async () => {
      const res = await request(app)
        .post('/api/marks/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examination_id: 1,
          subject_id: 1,
          max_marks: 100,
          passing_marks: 40,
          marks: [
            {
              student_id: student1Id,
              marks_obtained: 150 // Invalid: > max 100
            }
          ]
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot exceed maximum marks/i);
    });

    it('should reject negative marks obtained', async () => {
      const res = await request(app)
        .post('/api/marks/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examination_id: 1,
          subject_id: 1,
          max_marks: 100,
          passing_marks: 40,
          marks: [
            {
              student_id: student1Id,
              marks_obtained: -10 // Invalid: negative
            }
          ]
        });
      expect(res.status).toBe(400);
    });

    it('should prevent duplicate attendance session for same subject, date and time', async () => {
      // 1. Create session
      const createRes = await request(app)
        .post('/api/attendance/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject_id: 1,
          semester_id: 4,
          session_date: '2026-04-10',
          session_time: '09:00 - 10:00 AM',
          session_type: 'lecture',
          topic: 'Complexity Classes and NP-Completeness',
          records: [
            { student_id: student1Id, status: 'present' }
          ]
        });
      expect(createRes.status).toBe(201);

      // 2. Try to create duplicate session
      const dupRes = await request(app)
        .post('/api/attendance/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject_id: 1,
          semester_id: 4,
          session_date: '2026-04-10',
          session_time: '09:00 - 10:00 AM',
          session_type: 'lecture',
          topic: 'Complexity Classes and NP-Completeness',
          records: [
            { student_id: student1Id, status: 'present' }
          ]
        });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.message).toMatch(/already exists/i);
    });
  });
});
