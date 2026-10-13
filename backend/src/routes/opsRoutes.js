const express = require('express');
const router = express.Router();
const { checkDBStatus } = require('../config/db');
const { register } = require('../middleware/metrics');

// Service Root
router.get('/', (req, res) => {
  res.status(200).json({
    service: 'TaskBoard Cloud API',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    docs: '/api/docs',
    endpoints: {
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
      tasks: '/api/tasks',
      stats: '/api/tasks/stats',
    },
  });
});

// Liveness Probe: Cheap check to verify process is alive
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

// Readiness Probe: Verifies dependencies (MongoDB) are available before accepting traffic
router.get('/ready', (req, res) => {
  const dbReady = checkDBStatus();

  if (dbReady) {
    return res.status(200).json({
      status: 'READY',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          type: 'MongoDB',
          status: 'connected',
        },
      },
    });
  }

  return res.status(503).json({
    status: 'NOT_READY',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: {
        type: 'MongoDB',
        status: 'disconnected',
      },
    },
    message: 'Database connection is not established yet',
  });
});

// Prometheus Metrics Endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send(`Error collecting metrics: ${error.message}`);
  }
});

module.exports = router;
