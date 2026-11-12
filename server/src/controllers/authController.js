const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { User, Student, Department, Course, Semester } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password, rememberMe } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      },
      include: [
        {
          model: Student,
          as: 'studentProfile',
          include: [
            { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
            { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
            { model: Semester, as: 'currentSemester', attributes: ['id', 'name', 'semester_number'] }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save({ fields: ['last_login'] });

    // Generate JWT
    const expiresIn = rememberMe ? '7d' : (process.env.JWT_EXPIRES_IN || '24h');
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        studentId: user.studentProfile ? user.studentProfile.id : null
      },
      process.env.JWT_SECRET || 'sms_super_secret_jwt_key_2026_production_grade_security',
      { expiresIn }
    );

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      newValues: { role: user.role },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login,
        studentProfile: user.studentProfile || null
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Student,
          as: 'studentProfile',
          include: [
            { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
            { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
            { model: Semester, as: 'currentSemester', attributes: ['id', 'name', 'semester_number'] }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login,
        studentProfile: user.studentProfile || null
      }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logAudit({
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'USER',
      entityId: user.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Avoid user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.reset_token = resetToken;
    user.reset_token_expires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await logAudit({
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      entity: 'USER',
      entityId: user.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      // In development mode, return token for easy testing
      demoResetToken: resetToken
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.'
      });
    }

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    await logAudit({
      userId: user.id,
      action: 'RESET_PASSWORD_SUCCESS',
      entity: 'USER',
      entityId: user.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in.'
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      action: 'LOGOUT',
      entity: 'USER',
      entityId: req.user.id,
      req
    });
  }
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
};
