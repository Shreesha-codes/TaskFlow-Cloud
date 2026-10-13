const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET /api/tasks/stats - Must be registered before /:id to prevent route collision
router.get('/stats', async (req, res) => {
  try {
    const tasks = await Task.find();
    const total = tasks.length;

    const byStatus = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    tasks.forEach((t) => {
      if (byStatus[t.status] !== undefined) byStatus[t.status]++;
      if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
    });

    const completionRate = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

    res.status(200).json({
      total,
      byStatus,
      byPriority,
      completionRate,
      activeTasks: total - byStatus.done,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute stats', details: error.message });
  }
});

// GET /api/tasks - List all tasks with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, priority, search, sort = '-createdAt' } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { assignee: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query).sort(sort);
    res.status(200).json({ count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
});

// GET /api/tasks/:id - Fetch task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Invalid task ID', details: error.message });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, assignee, dueDate, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = new Task({
      title: title.trim(),
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || 'DevOps Engineer',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: Array.isArray(tags) ? tags : ['devops'],
    });

    const saved = await newTask.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: 'Validation failed', details: error.message });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'tags'];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: 'Update failed', details: error.message });
  }
});

// DELETE /api/tasks/:id - Remove task
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

// POST /api/tasks/seed - Populate initial realistic demo tasks
router.post('/seed', async (req, res) => {
  try {
    const count = await Task.countDocuments();
    if (count > 0 && !req.query.force) {
      return res.status(200).json({ message: 'Tasks already seeded', count });
    }

    if (req.query.force) {
      await Task.deleteMany({});
    }

    const defaultTasks = [
      {
        title: 'Configure AWS VPC and EKS with Terraform',
        description: 'Provision private subnets, NAT Gateways, and managed worker node pools using Terraform HCL.',
        status: 'done',
        priority: 'high',
        assignee: 'Infra Lead',
        tags: ['terraform', 'aws', 'eks'],
      },
      {
        title: 'Integrate Trivy container security scanner in CI',
        description: 'Add automated container image scanning in GitHub Actions pipeline to block High and Critical CVEs.',
        status: 'in_progress',
        priority: 'urgent',
        assignee: 'Security Engineer',
        tags: ['devsecops', 'trivy', 'ci/cd'],
      },
      {
        title: 'Package TaskBoard manifests into Helm Chart',
        description: 'Parameterize values.yaml for dev and prod environments with ConfigMaps and Secrets.',
        status: 'todo',
        priority: 'medium',
        assignee: 'DevOps Engineer',
        tags: ['helm', 'kubernetes'],
      },
      {
        title: 'Configure Prometheus ServiceMonitor & Grafana Dashboards',
        description: 'Scrape /metrics endpoint from backend pods and build latency and error-rate monitoring panels.',
        status: 'todo',
        priority: 'high',
        assignee: 'SRE Specialist',
        tags: ['prometheus', 'grafana', 'monitoring'],
      },
      {
        title: 'Simulate Pod ImagePullBackOff Troubleshooting Lab',
        description: 'Create deliberately faulty deployment to test cluster incident triage and rollback procedures.',
        status: 'backlog',
        priority: 'low',
        assignee: 'QA Lead',
        tags: ['troubleshooting', 'k8s'],
      },
    ];

    const inserted = await Task.insertMany(defaultTasks);
    res.status(201).json({ message: 'Seeded successfully', count: inserted.length, data: inserted });
  } catch (error) {
    res.status(500).json({ error: 'Seed failed', details: error.message });
  }
});

module.exports = router;
