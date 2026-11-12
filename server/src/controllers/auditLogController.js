const { AuditLog, User } = require('../models');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, entity, action } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (entity) where.entity = entity;
    if (action) where.action = action;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'role'] }
      ]
    });

    return res.status(200).json({
      success: true,
      logs: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
