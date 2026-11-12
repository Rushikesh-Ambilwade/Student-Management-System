const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mark = sequelize.define('Mark', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  examination_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  max_marks: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 100.00
  },
  passing_marks: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 40.00
  },
  marks_obtained: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  is_absent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  grade: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  remarks: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  entered_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'marks',
  hooks: {
    beforeSave: (mark) => {
      if (mark.is_absent) {
        mark.grade = 'AB';
        mark.marks_obtained = 0;
        return;
      }
      const pct = (Number(mark.marks_obtained) / Number(mark.max_marks)) * 100;
      if (Number(mark.marks_obtained) < Number(mark.passing_marks)) {
        mark.grade = 'F';
      } else if (pct >= 90) {
        mark.grade = 'A+';
      } else if (pct >= 80) {
        mark.grade = 'A';
      } else if (pct >= 70) {
        mark.grade = 'B+';
      } else if (pct >= 60) {
        mark.grade = 'B';
      } else if (pct >= 50) {
        mark.grade = 'C';
      } else {
        mark.grade = 'D';
      }
    }
  }
});

module.exports = Mark;
