const { AuditLog } = require('../models');

async function logAudit({ userId, action, entity, entityId, oldValues = null, newValues = null, req = null }) {
  try {
    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    }
    await AuditLog.create({
      user_id: userId || null,
      action,
      entity,
      entity_id: entityId || null,
      old_values: oldValues,
      new_values: newValues,
      ip_address: typeof ipAddress === 'string' ? ipAddress.substring(0, 50) : '127.0.0.1'
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
