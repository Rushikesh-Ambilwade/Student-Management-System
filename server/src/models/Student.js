const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  student_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false,
    defaultValue: 'Male'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profile_photo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  current_semester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  admission_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'graduated', 'suspended', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
  },
  emergency_contact_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(30),
    allowNull: true
  }
}, {
  tableName: 'students'
});

Student.prototype.getFullName = function () {
  return `${this.first_name} ${this.last_name}`;
};

module.exports = Student;
