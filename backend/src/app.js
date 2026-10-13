const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const opsRoutes = require('./routes/opsRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { metricsMiddleware } = require('./middleware/metrics');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Log HTTP requests in concise format (skip in test mode to keep runner clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/docs', (req, res) => res.redirect('/api/docs'));

// Routes
app.use('/', opsRoutes);
app.use('/api/tasks', taskRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    requestedPath: req.originalUrl,
    availableEndpoints: ['/', '/health', '/ready', '/metrics', '/docs', '/api/tasks', '/api/tasks/stats'],
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
