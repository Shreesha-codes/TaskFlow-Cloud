const client = require('prom-client');

// Initialize default recommended Prometheus runtime metrics (CPU, Memory, Event Loop, GC)
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'taskboard_' });

// Custom HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by TaskBoard API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom HTTP request duration histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Metric tracking middleware
const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    // Normalize route label to prevent high-cardinality ID explosions
    let route = req.baseUrl + (req.route ? req.route.path : req.path);
    if (!route || route === '') route = req.path;
    
    const statusCode = res.statusCode ? res.statusCode.toString() : 'unknown';

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationInSeconds
    );
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
};
