const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentFeeAssessment = sequelize.define('StudentFeeAssessment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fee_structure_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  scholarship_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  concession_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  net_payable: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  balance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'partially_paid', 'paid', 'overdue'),
    allowNull: false,
    defaultValue: 'pending'
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'student_fee_assessments',
  hooks: {
    beforeSave: (sfa) => {
      const net = Math.max(0, Number(sfa.total_amount) - Number(sfa.scholarship_amount || 0) - Number(sfa.concession_amount || 0));
      sfa.net_payable = net.toFixed(2);
      const bal = Math.max(0, net - Number(sfa.paid_amount || 0));
      sfa.balance_amount = bal.toFixed(2);

      if (bal <= 0) {
        sfa.status = 'paid';
      } else if (Number(sfa.paid_amount) > 0) {
        sfa.status = 'partially_paid';
      } else {
        const today = new Date().toISOString().split('T')[0];
        if (sfa.due_date && sfa.due_date < today) {
          sfa.status = 'overdue';
        } else {
          sfa.status = 'pending';
        }
      }
    }
  }
});

module.exports = StudentFeeAssessment;
