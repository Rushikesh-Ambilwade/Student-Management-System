const { Op } = require('sequelize');
const { Timetable, Subject, Course, Semester, Student } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const getTimetables = async (req, res, next) => {
  try {
    const { course_id, semester_id, day_of_week } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;
    if (semester_id) where.semester_id = semester_id;
    if (day_of_week) where.day_of_week = day_of_week;

    const timetables = await Timetable.findAll({
      where,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits', 'type'] },
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] }
      ],
      order: [
        ['day_of_week', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    return res.status(200).json({ success: true, timetables });
  } catch (error) {
    next(error);
  }
};

const getStudentTimetable = async (req, res, next) => {
  try {
    const student = await Student.findOne({ where: { user_id: req.user.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const timetables = await Timetable.findAll({
      where: {
        course_id: student.course_id,
        semester_id: student.current_semester_id
      },
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits', 'type'] },
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'name', 'semester_number'] }
      ],
      order: [
        ['day_of_week', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    // Group by Day of Week
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklySchedule = {};
    daysOrder.forEach(day => {
      weeklySchedule[day] = timetables.filter(t => t.day_of_week === day);
    });

    return res.status(200).json({
      success: true,
      weeklySchedule,
      allSlots: timetables
    });
  } catch (error) {
    next(error);
  }
};

const createTimetableSlot = async (req, res, next) => {
  try {
    const {
      course_id,
      semester_id,
      subject_id,
      day_of_week,
      start_time,
      end_time,
      room_number,
      faculty_name
    } = req.body;

    // Conflict Check 1: Room conflict
    const roomConflict = await Timetable.findOne({
      where: {
        day_of_week,
        room_number,
        [Op.or]: [
          {
            start_time: { [Op.lt]: end_time },
            end_time: { [Op.gt]: start_time }
          }
        ]
      }
    });

    if (roomConflict) {
      return res.status(409).json({
        success: false,
        message: `Room conflict: Room ${room_number} is already occupied on ${day_of_week} between ${roomConflict.start_time} and ${roomConflict.end_time}.`
      });
    }

    // Conflict Check 2: Same class section conflict
    const classConflict = await Timetable.findOne({
      where: {
        course_id,
        semester_id,
        day_of_week,
        [Op.or]: [
          {
            start_time: { [Op.lt]: end_time },
            end_time: { [Op.gt]: start_time }
          }
        ]
      }
    });

    if (classConflict) {
      return res.status(409).json({
        success: false,
        message: `Schedule conflict: This class already has another subject scheduled on ${day_of_week} during this time slot.`
      });
    }

    const slot = await Timetable.create({
      course_id,
      semester_id,
      subject_id,
      day_of_week,
      start_time,
      end_time,
      room_number,
      faculty_name
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_TIMETABLE_SLOT',
      entity: 'TIMETABLE',
      entityId: slot.id,
      newValues: { course_id, semester_id, subject_id, day_of_week, room_number },
      req
    });

    return res.status(201).json({ success: true, slot });
  } catch (error) {
    next(error);
  }
};

const deleteTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slot = await Timetable.findByPk(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    await slot.destroy();
    return res.status(200).json({ success: true, message: 'Timetable entry removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimetables,
  getStudentTimetable,
  createTimetableSlot,
  deleteTimetableSlot
};
