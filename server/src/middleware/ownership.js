const verifyStudentOwnership = (paramKey = 'studentId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admins can access all student records
    if (req.user.role === 'admin') {
      return next();
    }

    // If user is a student, verify they are accessing only their own record
    if (req.user.role === 'student') {
      const targetStudentId = req.params[paramKey] || req.body[paramKey] || req.query[paramKey];
      if (!req.student) {
        return res.status(403).json({
          success: false,
          message: 'Student profile not associated with this account.'
        });
      }

      if (targetStudentId && String(req.student.id) !== String(targetStudentId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view or interact with your own academic records.'
        });
      }

      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  };
};

module.exports = { verifyStudentOwnership };
