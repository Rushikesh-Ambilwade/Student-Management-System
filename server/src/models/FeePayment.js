const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeePayment = sequelize.define('FeePayment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  assessment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receipt_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  payment_mode: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'online', 'cheque', 'upi'),
    allowNull: false,
    defaultValue: 'online'
  },
  transaction_ref: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  remarks: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  collected_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'fee_payments'
});

module.exports = FeePayment;
