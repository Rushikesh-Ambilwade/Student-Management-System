const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.error('⚠️ Could not connect to database. Starting server anyway in degraded mode.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Student Management System API running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing HTTP server.');
    server.close(() => {
      console.log('HTTP server closed.');
    });
  });
}

startServer();
