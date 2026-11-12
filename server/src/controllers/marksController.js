const { Op } = require('sequelize');
const {
  sequelize,
  Examination,
  Mark,
  Student,
  Subject,
  Course,
  Semester,
  Department
} = require('../models');
const { logAudit } = require('../utils/auditLogger');

// --- EXAMINATIONS ---
const getExaminations = async (req, res, next) => {
  try {
    const { course_id, semester_id } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;
    if (semester_id) where.semester_id = semester_id;

    const exams = await Examination.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] },
        { model: Mark, as: 'marks', attributes: ['id'] }
      ],
      order: [['start_date', 'DESC']]
    });

    const data = exams.map(e => ({
      ...e.toJSON(),
      marksCount: e.marks?.length || 0
    }));

    return res.status(200).json({ success: true, examinations: data });
  } catch (error) {
    next(error);
  }
};

const createExamination = async (req, res, next) => {
  try {
    const { name, exam_type, course_id, semester_id, academic_year, start_date, end_date } = req.body;
    const exam = await Examination.create({
      name,
      exam_type: exam_type || 'internal_1',
      course_id,
      semester_id,
      academic_year: academic_year || '2025-2026',
      start_date,
      end_date
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_EXAMINATION',
      entity: 'EXAMINATION',
      entityId: exam.id,
      newValues: { name, exam_type, course_id, semester_id },
      req
    });

    return res.status(201).json({ success: true, examination: exam });
  } catch (error) {
    next(error);
  }
};

const updateExamination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Examination.findByPk(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const { name, exam_type, start_date, end_date, is_active } = req.body;
    await exam.update({ name, exam_type, start_date, end_date, is_active });

    return res.status(200).json({ success: true, examination: exam });
  } catch (error) {
    next(error);
  }
};

// --- MARKS ENTRY & REPORTS ---
const getExamSubjectMarks = async (req, res, next) => {
  try {
    const { examination_id, subject_id } = req.query;

    if (!examination_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'Both examination_id and subject_id are required query parameters.'
      });
    }

    const exam = await Examination.findByPk(examination_id, {
      include: [
        { model: Course, as: 'course' },
        { model: Semester, as: 'semester' }
      ]
    });
    const subject = await Subject.findByPk(subject_id);

    if (!exam || !subject) {
      return res.status(404).json({ success: false, message: 'Exam or Subject not found.' });
    }

    // Get all enrolled students for this course and semester
    const enrolledStudents = await Student.findAll({
      where: {
        course_id: exam.course_id,
        current_semester_id: exam.semester_id,
        status: 'active'
      },
      order: [['student_id', 'ASC']]
    });

    // Get existing marks
    const existingMarks = await Mark.findAll({
      where: {
        examination_id,
        subject_id
      }
    });

    const marksMap = {};
    existingMarks.forEach(m => {
      marksMap[m.student_id] = m;
    });

    // Merge students with their existing marks
    const studentsWithMarks = enrolledStudents.map(st => {
      const markRecord = marksMap[st.id] || null;
      return {
        student_id: st.id,
        roll_number: st.student_id,
        name: `${st.first_name} ${st.last_name}`,
        email: st.email,
        profile_photo: st.profile_photo,
        mark_id: markRecord ? markRecord.id : null,
        max_marks: markRecord ? Number(markRecord.max_marks) : 100,
        passing_marks: markRecord ? Number(markRecord.passing_marks) : 40,
        marks_obtained: markRecord ? Number(markRecord.marks_obtained) : '',
        is_absent: markRecord ? markRecord.is_absent : false,
        grade: markRecord ? markRecord.grade : null,
        remarks: markRecord ? markRecord.remarks : ''
      };
    });

    return res.status(200).json({
      success: true,
      exam,
      subject,
      students: studentsWithMarks
    });
  } catch (error) {
    next(error);
  }
};

const batchEnterMarks = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { examination_id, subject_id, max_marks = 100, passing_marks = 40, marks } = req.body;

    const exam = await Examination.findByPk(examination_id, { transaction: t });
    const subject = await Subject.findByPk(subject_id, { transaction: t });

    if (!exam || !subject) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Exam or Subject not found.' });
    }

    // Validation: Ensure marks obtained is between 0 and max_marks
    for (const m of marks) {
      const obt = Number(m.marks_obtained || 0);
      const max = Number(m.max_marks || max_marks);
      if (!m.is_absent && (obt < 0 || obt > max)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Marks obtained (${obt}) cannot exceed maximum marks (${max}) or be negative for student ID ${m.student_id}.`
        });
      }
    }

    let updatedCount = 0;
    let createdCount = 0;

    for (const item of marks) {
      const maxM = Number(item.max_marks || max_marks);
      const passM = Number(item.passing_marks || passing_marks);
      const obtM = item.is_absent ? 0 : Number(item.marks_obtained || 0);

      // Grade calculation
      let grade = 'F';
      if (item.is_absent) {
        grade = 'AB';
      } else {
        const pct = (obtM / maxM) * 100;
        if (obtM < passM) grade = 'F';
        else if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B+';
        else if (pct >= 60) grade = 'B';
        else if (pct >= 50) grade = 'C';
        else grade = 'D';
      }

      const existing = await Mark.findOne({
        where: {
          examination_id,
          subject_id,
          student_id: item.student_id
        },
        transaction: t
      });

      if (existing) {
        await existing.update({
          max_marks: maxM,
          passing_marks: passM,
          marks_obtained: obtM,
          is_absent: Boolean(item.is_absent),
          grade,
          remarks: item.remarks || null,
          entered_by: req.user.username
        }, { transaction: t });
        updatedCount++;
      } else {
        await Mark.create({
          examination_id,
          subject_id,
          student_id: item.student_id,
          max_marks: maxM,
          passing_marks: passM,
          marks_obtained: obtM,
          is_absent: Boolean(item.is_absent),
          grade,
          remarks: item.remarks || null,
          entered_by: req.user.username
        }, { transaction: t });
        createdCount++;
      }
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'BATCH_ENTER_MARKS',
      entity: 'MARK',
      entityId: examination_id,
      newValues: { examination_id, subject_id, createdCount, updatedCount },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Marks recorded successfully. (${createdCount} created, ${updatedCount} updated).`
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Student's Academic Result Card
const getStudentMarks = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId, {
      include: [
        { model: Department, as: 'department' },
        { model: Course, as: 'course' },
        { model: Semester, as: 'currentSemester' }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const marks = await Mark.findAll({
      where: { student_id: studentId },
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits', 'type'] },
        { model: Examination, as: 'examination', attributes: ['id', 'name', 'exam_type', 'academic_year'] }
      ],
      order: [['examination_id', 'ASC']]
    });

    // Group by examination
    const examMap = {};
    let totalObtAll = 0;
    let totalMaxAll = 0;
    let totalCredits = 0;

    marks.forEach(m => {
      const eId = m.examination?.id || 0;
      const eName = m.examination?.name || 'General Examination';

      if (!examMap[eId]) {
        examMap[eId] = {
          examinationId: eId,
          examinationName: eName,
          examType: m.examination?.exam_type,
          academicYear: m.examination?.academic_year,
          marks: [],
          totalObtained: 0,
          totalMax: 0,
          hasFailed: false
        };
      }

      const obt = Number(m.marks_obtained);
      const max = Number(m.max_marks);
      const pass = Number(m.passing_marks);
      const isFail = m.is_absent || obt < pass;

      if (isFail) examMap[eId].hasFailed = true;

      examMap[eId].marks.push({
        id: m.id,
        subjectId: m.subject?.id,
        subjectCode: m.subject?.code,
        subjectName: m.subject?.name,
        subjectType: m.subject?.type,
        credits: m.subject?.credits || 3,
        maxMarks: max,
        passingMarks: pass,
        marksObtained: obt,
        isAbsent: m.is_absent,
        grade: m.grade,
        isPass: !isFail,
        remarks: m.remarks
      });

      examMap[eId].totalObtained += obt;
      examMap[eId].totalMax += max;

      totalObtAll += obt;
      totalMaxAll += max;
      totalCredits += (m.subject?.credits || 3);
    });

    const examsList = Object.values(examMap).map(e => {
      const pct = e.totalMax > 0 ? ((e.totalObtained / e.totalMax) * 100).toFixed(1) : '0.0';
      return {
        ...e,
        percentage: pct,
        resultStatus: e.hasFailed ? 'FAIL' : 'PASS'
      };
    });

    const overallPercentage = totalMaxAll > 0 ? ((totalObtAll / totalMaxAll) * 100).toFixed(1) : '0.0';

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
        totalExaminations: examsList.length,
        totalSubjectsEvaluated: marks.length,
        overallPercentage,
        overallGrade: Number(overallPercentage) >= 85 ? 'A+' : (Number(overallPercentage) >= 75 ? 'A' : (Number(overallPercentage) >= 60 ? 'B' : 'C'))
      },
      examinations: examsList,
      rawMarks: marks
    });
  } catch (error) {
    next(error);
  }
};

const exportResultsCSV = async (req, res, next) => {
  try {
    const { examination_id } = req.query;
    const where = {};
    if (examination_id) where.examination_id = examination_id;

    const marks = await Mark.findAll({
      where,
      include: [
        { model: Student, as: 'student', attributes: ['student_id', 'first_name', 'last_name', 'email'] },
        { model: Subject, as: 'subject', attributes: ['code', 'name'] },
        { model: Examination, as: 'examination', attributes: ['name'] }
      ],
      order: [['student_id', 'ASC']]
    });

    const headers = ['Student ID', 'Student Name', 'Examination', 'Subject Code', 'Subject Name', 'Max Marks', 'Passing Marks', 'Marks Obtained', 'Absent', 'Grade', 'Result'];
    const rows = marks.map(m => [
      `"${m.student?.student_id}"`,
      `"${m.student?.first_name} ${m.student?.last_name}"`,
      `"${m.examination?.name}"`,
      `"${m.subject?.code}"`,
      `"${m.subject?.name}"`,
      m.max_marks,
      m.passing_marks,
      m.marks_obtained,
      m.is_absent ? 'YES' : 'NO',
      `"${m.grade}"`,
      (!m.is_absent && Number(m.marks_obtained) >= Number(m.passing_marks)) ? 'PASS' : 'FAIL'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="examination_results.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExaminations,
  createExamination,
  updateExamination,
  getExamSubjectMarks,
  batchEnterMarks,
  getStudentMarks,
  exportResultsCSV
};
