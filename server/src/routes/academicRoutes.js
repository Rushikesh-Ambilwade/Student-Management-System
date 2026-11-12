const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getCourses,
  createCourse,
  updateCourse,
  getSemesters,
  createSemester,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/academicController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Departments
router.get('/departments', authenticate, getDepartments);
router.post('/departments', authenticate, authorize(['admin']), createDepartment);
router.put('/departments/:id', authenticate, authorize(['admin']), updateDepartment);
router.delete('/departments/:id', authenticate, authorize(['admin']), deleteDepartment);

// Courses
router.get('/courses', authenticate, getCourses);
router.post('/courses', authenticate, authorize(['admin']), createCourse);
router.put('/courses/:id', authenticate, authorize(['admin']), updateCourse);

// Semesters
router.get('/semesters', authenticate, getSemesters);
router.post('/semesters', authenticate, authorize(['admin']), createSemester);

// Subjects
router.get('/subjects', authenticate, getSubjects);
router.post('/subjects', authenticate, authorize(['admin']), createSubject);
router.put('/subjects/:id', authenticate, authorize(['admin']), updateSubject);
router.delete('/subjects/:id', authenticate, authorize(['admin']), deleteSubject);

module.exports = router;
