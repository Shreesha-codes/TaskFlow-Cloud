const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Task = require('../src/models/Task');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await Task.deleteMany({});
});

describe('Task API Endpoints', () => {
  it('POST /api/tasks - should create a new task successfully', async () => {
    const payload = {
      title: 'Deploy to AWS EKS',
      description: 'Run helm upgrade on EKS cluster',
      status: 'todo',
      priority: 'high',
      assignee: 'DevOps Student',
    };

    const res = await request(app).post('/api/tasks').send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(payload.title);
    expect(res.body.status).toBe('todo');
    expect(res.body.priority).toBe('high');
    expect(res.body).toHaveProperty('id');
  });

  it('POST /api/tasks - should reject empty title with 400', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'No title provided' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/tasks - should fetch tasks with filters', async () => {
    await Task.create([
      { title: 'Task 1', status: 'in_progress', priority: 'urgent' },
      { title: 'Task 2', status: 'done', priority: 'low' },
    ]);

    const res = await request(app).get('/api/tasks?status=in_progress');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('Task 1');
  });

  it('GET /api/tasks/stats - should compute KPI metrics correctly', async () => {
    await Task.create([
      { title: 'Task 1', status: 'done', priority: 'medium' },
      { title: 'Task 2', status: 'in_progress', priority: 'high' },
      { title: 'Task 3', status: 'todo', priority: 'urgent' },
    ]);

    const res = await request(app).get('/api/tasks/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.byStatus.done).toBe(1);
    expect(res.body.byStatus.in_progress).toBe(1);
    expect(res.body.byPriority.urgent).toBe(1);
    expect(res.body.completionRate).toBe(33);
  });

  it('PUT /api/tasks/:id - should update task status', async () => {
    const task = await Task.create({ title: 'Build Docker Image', status: 'todo' });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .send({ status: 'done' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('done');
  });

  it('DELETE /api/tasks/:id - should delete an existing task', async () => {
    const task = await Task.create({ title: 'Temporary Task' });

    const res = await request(app).delete(`/api/tasks/${task._id}`);
    expect(res.statusCode).toBe(200);

    const check = await Task.findById(task._id);
    expect(check).toBeNull();
  });
});
