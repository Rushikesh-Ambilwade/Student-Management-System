const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeStructure = sequelize.define('FeeStructure', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Regular'
  },
  tuition_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  lab_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  library_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  exam_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  other_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'fee_structures',
  hooks: {
    beforeSave: (fs) => {
      fs.total_amount = (
        Number(fs.tuition_fee || 0) +
        Number(fs.lab_fee || 0) +
        Number(fs.library_fee || 0) +
        Number(fs.exam_fee || 0) +
        Number(fs.other_fee || 0)
      ).toFixed(2);
    }
  }
});

module.exports = FeeStructure;
