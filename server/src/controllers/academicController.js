const { Department, Course, Semester, Subject, Student } = require('../models');
const { logAudit } = require('../utils/auditLogger');

// --- DEPARTMENTS ---
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      include: [
        { model: Course, as: 'courses', attributes: ['id', 'name', 'code'] },
        { model: Student, as: 'students', attributes: ['id'] }
      ],
      order: [['name', 'ASC']]
    });

    const data = departments.map(d => ({
      ...d.toJSON(),
      coursesCount: d.courses?.length || 0,
      studentsCount: d.students?.length || 0
    }));

    return res.status(200).json({ success: true, departments: data });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { code, name, description, head_of_department, contact_email } = req.body;
    const department = await Department.create({
      code,
      name,
      description,
      head_of_department,
      contact_email
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_DEPARTMENT',
      entity: 'DEPARTMENT',
      entityId: department.id,
      newValues: { code, name },
      req
    });

    return res.status(201).json({ success: true, department });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const { code, name, description, head_of_department, contact_email, is_active } = req.body;
    await department.update({ code, name, description, head_of_department, contact_email, is_active });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_DEPARTMENT',
      entity: 'DEPARTMENT',
      entityId: department.id,
      newValues: { code, name, is_active },
      req
    });

    return res.status(200).json({ success: true, department });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id, {
      include: [{ model: Course, as: 'courses' }]
    });

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (department.courses && department.courses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active linked courses. Deactivate it instead.'
      });
    }

    await department.destroy();
    return res.status(200).json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// --- COURSES ---
const getCourses = async (req, res, next) => {
  try {
    const { department_id } = req.query;
    const where = {};
    if (department_id) where.department_id = department_id;

    const courses = await Course.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semesters', attributes: ['id', 'name', 'semester_number'] },
        { model: Student, as: 'students', attributes: ['id'] }
      ],
      order: [['name', 'ASC']]
    });

    const data = courses.map(c => ({
      ...c.toJSON(),
      studentsCount: c.students?.length || 0
    }));

    return res.status(200).json({ success: true, courses: data });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { department_id, code, name, description, duration_years, total_semesters } = req.body;
    const course = await Course.create({
      department_id,
      code,
      name,
      description,
      duration_years: duration_years || 4,
      total_semesters: total_semesters || 8
    });

    // Auto-create semesters for this course
    const semestersToCreate = [];
    for (let i = 1; i <= (total_semesters || 8); i++) {
      semestersToCreate.push({
        course_id: course.id,
        semester_number: i,
        name: `Semester ${i}`,
        academic_year: '2025-2026',
        is_active: true
      });
    }
    await Semester.bulkCreate(semestersToCreate);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_COURSE',
      entity: 'COURSE',
      entityId: course.id,
      newValues: { code, name },
      req
    });

    return res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const { department_id, code, name, description, duration_years, total_semesters, is_active } = req.body;
    await course.update({ department_id, code, name, description, duration_years, total_semesters, is_active });

    return res.status(200).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// --- SEMESTERS ---
const getSemesters = async (req, res, next) => {
  try {
    const { course_id } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;

    const semesters = await Semester.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subjects', attributes: ['id', 'name', 'code', 'credits'] }
      ],
      order: [['course_id', 'ASC'], ['semester_number', 'ASC']]
    });

    return res.status(200).json({ success: true, semesters });
  } catch (error) {
    next(error);
  }
};

const createSemester = async (req, res, next) => {
  try {
    const { course_id, semester_number, name, academic_year } = req.body;
    const semester = await Semester.create({ course_id, semester_number, name, academic_year });
    return res.status(201).json({ success: true, semester });
  } catch (error) {
    next(error);
  }
};

// --- SUBJECTS ---
const getSubjects = async (req, res, next) => {
  try {
    const { course_id, semester_id } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;
    if (semester_id) where.semester_id = semester_id;

    const subjects = await Subject.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] }
      ],
      order: [['code', 'ASC']]
    });

    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { course_id, semester_id, code, name, credits, type, faculty_name } = req.body;
    const subject = await Subject.create({
      course_id,
      semester_id,
      code,
      name,
      credits: credits || 3,
      type: type || 'theory',
      faculty_name
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_SUBJECT',
      entity: 'SUBJECT',
      entityId: subject.id,
      newValues: { code, name },
      req
    });

    return res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const { course_id, semester_id, code, name, credits, type, faculty_name, is_active } = req.body;
    await subject.update({ course_id, semester_id, code, name, credits, type, faculty_name, is_active });

    return res.status(200).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    await subject.destroy();
    return res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
