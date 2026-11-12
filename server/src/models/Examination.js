const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Examination = sequelize.define('Examination', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  exam_type: {
    type: DataTypes.ENUM('internal_1', 'internal_2', 'practical', 'assignment', 'semester_final'),
    allowNull: false,
    defaultValue: 'internal_1'
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'examinations'
});

module.exports = Examination;
