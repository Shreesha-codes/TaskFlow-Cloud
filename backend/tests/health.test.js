const request = require('supertest');
const app = require('../src/app');

describe('DevOps Probes & Operational Endpoints', () => {
  it('GET / should return service info and available endpoints', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('TaskBoard Cloud API');
    expect(res.body.endpoints).toHaveProperty('health');
    expect(res.body.endpoints).toHaveProperty('ready');
    expect(res.body.endpoints).toHaveProperty('metrics');
  });

  it('GET /health (Liveness Probe) should return 200 HEALTHY', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /ready (Readiness Probe) should respond with dependency status', async () => {
    const res = await request(app).get('/ready');
    // Without active DB in this isolated unit test, returns 503 (NOT_READY) or 200 (READY)
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('dependencies');
  });

  it('GET /metrics should return Prometheus metrics with proper content type', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('taskboard_');
  });
});
