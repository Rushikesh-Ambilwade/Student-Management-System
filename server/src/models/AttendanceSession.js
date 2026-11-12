const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceSession = sequelize.define('AttendanceSession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  session_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  session_time: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  topic: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  session_type: {
    type: DataTypes.ENUM('lecture', 'lab', 'tutorial'),
    allowNull: false,
    defaultValue: 'lecture'
  },
  conducted_by: {
    type: DataTypes.STRING(150),
    allowNull: true
  }
}, {
  tableName: 'attendance_sessions'
});

module.exports = AttendanceSession;
