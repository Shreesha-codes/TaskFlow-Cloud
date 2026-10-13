require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskboard';

let server;

const startServer = async () => {
  // Connect to DB asynchronously (Kubernetes readiness probe will reflect connection state)
  await connectDB(MONGODB_URI);

  server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 TaskBoard Backend running on port ${PORT}`);
    console.log(`📡 Health Check:  http://localhost:${PORT}/health`);
    console.log(`🚦 Ready Check:   http://localhost:${PORT}/ready`);
    console.log(`📊 Metrics:       http://localhost:${PORT}/metrics`);
    console.log(`📖 Swagger Docs:  http://localhost:${PORT}/docs`);
    console.log(`📋 API Tasks:     http://localhost:${PORT}/api/tasks`);
    console.log(`===============================================`);
  });
};

// Graceful Shutdown for Kubernetes Pod Lifecycle
const gracefulShutdown = (signal) => {
  console.log(`[Lifecycle] Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(() => {
      console.log('[Lifecycle] HTTP server closed cleanly. Exiting process.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
