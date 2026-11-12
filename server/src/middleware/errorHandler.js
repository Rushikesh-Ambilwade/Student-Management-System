const errorHandler = (err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method
  });

  // Sequelize Unique Constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map(e => e.path).join(', ');
    return res.status(409).json({
      success: false,
      message: `Conflict: A record with this ${fields} already exists.`,
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  // Sequelize Foreign Key Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint error: Referenced entity does not exist or has active dependencies.'
    });
  }

  // Custom Application Error
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = { errorHandler, notFound };
