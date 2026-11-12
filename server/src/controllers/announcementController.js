const { Op } = require('sequelize');
const { Announcement, Student } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const getAnnouncements = async (req, res, next) => {
  try {
    const { target_type, priority, is_active } = req.query;
    const where = {};

    if (target_type) where.target_type = target_type;
    if (priority) where.priority = priority;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    // If student is logged in, filter only announcements relevant to them
    if (req.user.role === 'student' && req.student) {
      const student = req.student;
      where[Op.or] = [
        { target_type: 'all' },
        { target_type: 'department', target_id: student.department_id },
        { target_type: 'course', target_id: student.course_id },
        { target_type: 'semester', target_id: student.current_semester_id },
        { target_type: 'student', target_id: student.id }
      ];
      where.is_active = true;
    }

    const announcements = await Announcement.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      content,
      target_type = 'all',
      target_id = null,
      priority = 'medium',
      publish_date,
      expiry_date
    } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      target_type,
      target_id: target_id || null,
      priority,
      publish_date: publish_date || new Date().toISOString().split('T')[0],
      expiry_date: expiry_date || null,
      created_by: req.user.username,
      is_active: true
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'ANNOUNCEMENT',
      entityId: announcement.id,
      newValues: { title, priority, target_type },
      req
    });

    return res.status(201).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const { title, content, target_type, target_id, priority, publish_date, expiry_date, is_active } = req.body;
    await announcement.update({
      title,
      content,
      target_type,
      target_id,
      priority,
      publish_date,
      expiry_date,
      is_active
    });

    return res.status(200).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    await announcement.destroy();
    return res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
