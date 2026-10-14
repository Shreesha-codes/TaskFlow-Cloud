import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban,
  GitBranch,
  Activity,
  Server,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Search,
  List,
  Columns,
  Sparkles,
  Terminal,
  ShieldCheck,
  Check,
  X,
  Cpu
} from 'lucide-react';
import './App.css';

const DEFAULT_STATS = {
  total: 0,
  byStatus: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
  byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
  completionRate: 0,
  activeTasks: 0,
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNav, setActiveNav] = useState('board');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    status: 'CONNECTING',
    uptime: 0,
    dbStatus: 'pending',
    latencyMs: 0,
  });

  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: 'DevOps Engineer',
    tags: 'kubernetes, devops',
  });

  // Fetch tasks and KPI stats
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasksRes, statsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks/stats'),
      ]);

      if (!tasksRes.ok || !statsRes.ok) {
        throw new Error(`API returned error (${tasksRes.status}/${statsRes.status})`);
      }

      const tasksJson = await tasksRes.json();
      const statsJson = await statsRes.json();

      setTasks(tasksJson.data || []);
      setStats(statsJson);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Unable to reach backend API');
    } finally {
      setLoading(false);
    }
  };

  // Check health and readiness probes
  const pingHealth = async () => {
    const start = performance.now();
    try {
      const [healthRes, readyRes] = await Promise.all([
        fetch('/health'),
        fetch('/ready'),
      ]);
      const latency = Math.round(performance.now() - start);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        const readyData = await readyRes.json();
        setSystemHealth({
          status: 'HEALTHY',
          uptime: healthData.uptimeSeconds || 0,
          dbStatus: readyData.status === 'READY' ? 'CONNECTED' : 'DISCONNECTED',
          latencyMs: latency,
        });
      } else {
        setSystemHealth((prev) => ({ ...prev, status: 'DEGRADED', latencyMs: latency }));
      }
    } catch (e) {
      setSystemHealth({
        status: 'OFFLINE',
        uptime: 0,
        dbStatus: 'OFFLINE',
        latencyMs: 0,
      });
    }
  };

  useEffect(() => {
    fetchData();
    pingHealth();
    const interval = setInterval(pingHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks locally
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.assignee && t.assignee.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Handle task status update
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Seed sample data
  const handleSeedData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks/seed?force=true', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Seed failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const tagsArray = newTask.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          status: newTask.status,
          priority: newTask.priority,
          assignee: newTask.assignee.trim(),
          tags: tagsArray,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewTask({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          assignee: 'DevOps Engineer',
          tags: 'kubernetes, devops',
        });
        fetchData();
      }
    } catch (err) {
      console.error('Create task failed', err);
    }
  };

  const getStatusBadgeClass = (status) => `badge badge-status-${status}`;
  const getPriorityBadgeClass = (priority) => `badge badge-priority-${priority}`;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand-section">
            <div className="brand-icon">
              <Server size={20} />
            </div>
            <div>
              <div className="brand-title">TaskBoard</div>
              <span className="brand-tag">MERN DevOps</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Workspace</div>
            <button
              className={`nav-item ${activeNav === 'board' ? 'active' : ''}`}
              onClick={() => setActiveNav('board')}
            >
              <Kanban size={18} />
              Sprint Board
            </button>
            <button
              className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveNav('dashboard')}
            >
              <LayoutDashboard size={18} />
              Overview & KPIs
            </button>
            <button
              className={`nav-item ${activeNav === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveNav('pipeline')}
            >
              <GitBranch size={18} />
              CI/CD Pipeline
            </button>
            <button
              className={`nav-item ${activeNav === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveNav('metrics')}
            >
              <Activity size={18} />
              Prometheus Metrics
            </button>

            <div className="nav-section-label">DevOps Links</div>
            <a href="/docs" target="_blank" rel="noreferrer" className="nav-item">
              <Terminal size={18} />
              Swagger OpenAPI
              <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
            </a>
            <a href="/metrics" target="_blank" rel="noreferrer" className="nav-item">
              <Activity size={18} />
              Prometheus /metrics
              <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
            </a>
            <a href="/health" target="_blank" rel="noreferrer" className="nav-item">
              <ShieldCheck size={18} />
              Liveness Probe (/health)
              <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
            </a>
            <a href="/ready" target="_blank" rel="noreferrer" className="nav-item">
              <CheckCircle2 size={18} />
              Readiness Probe (/ready)
              <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
            </a>
          </nav>
        </div>

        {/* Cluster Status Footer Card */}
        <div className="cluster-card">
          <div className="cluster-header">
            <span>AWS EKS Cluster</span>
            <div className="pulse-dot" />
          </div>
          <div className="cluster-details">
            Region: ap-south-1<br />
            Namespace: taskboard<br />
            API Latency: {systemHealth.latencyMs}ms
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">TaskBoard Cloud Engineering</h1>
            <div className="topbar-badge">
              <span className="pulse-dot" />
              {systemHealth.status === 'HEALTHY' ? 'Liveness: Healthy' : `Liveness: ${systemHealth.status}`}
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks, assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="btn btn-secondary" onClick={handleSeedData} title="Populate realistic tasks">
              <Sparkles size={16} />
              Seed Demo Tasks
            </button>

            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              New Task
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          {/* Pipeline Status Indicator Ribbon */}
          <div className="pipeline-ribbon">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Terminal size={18} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>DevOps Lifecycle Pipeline</span>
            </div>
            <div className="pipeline-stage-list">
              <span className="pipeline-pill success">
                <Check size={12} /> Git: commit #a8f4c2
              </span>
              <span className="pipeline-pill success">
                <Check size={12} /> Jest Tests: Passing
              </span>
              <span className="pipeline-pill success">
                <ShieldCheck size={12} /> Trivy Scan: 0 Critical
              </span>
              <span className="pipeline-pill active">
                <Server size={12} /> GHCR Registry: Ready
              </span>
              <span className="pipeline-pill active">
                <Cpu size={12} /> EKS Pods: 2/2 HPA
              </span>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <section className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Total Work Items</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <Kanban size={18} />
                </div>
              </div>
              <div className="kpi-value">{stats.total}</div>
              <div className="kpi-footer">
                <span>{stats.activeTasks} active sprint deliverables</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">In Progress</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value">{stats.byStatus?.in_progress || 0}</div>
              <div className="kpi-footer">
                <span>Under active implementation</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Completion Rate</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-value">{stats.completionRate}%</div>
              <div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${stats.completionRate}%` }} />
                </div>
                <div className="kpi-footer" style={{ marginTop: '0.35rem' }}>
                  <span>{stats.byStatus?.done || 0} tasks finished</span>
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Urgent / High Priority</span>
                <div className="kpi-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value">
                {(stats.byPriority?.urgent || 0) + (stats.byPriority?.high || 0)}
              </div>
              <div className="kpi-footer">
                <span>Requires immediate triage</span>
              </div>
            </div>
          </section>

          {/* Controls Bar: Filters and Switcher */}
          <div className="controls-bar">
            <div className="status-tabs">
              {[
                { id: 'all', label: 'All Tasks' },
                { id: 'backlog', label: 'Backlog' },
                { id: 'todo', label: 'To Do' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'review', label: 'Review' },
                { id: 'done', label: 'Done' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`status-tab ${statusFilter === tab.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="filters-right">
              <select
                className="custom-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <List size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                  onClick={() => setViewMode('kanban')}
                  title="Kanban Board View"
                >
                  <Columns size={16} />
                </button>
              </div>

              <button className="btn btn-secondary" onClick={fetchData} title="Refresh data">
                <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
              </button>
            </div>
          </div>

          {/* Backend Error State Banner */}
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={20} color="#f43f5e" />
                <div>
                  <div style={{ fontWeight: '600', color: '#f43f5e' }}>Backend Connection Notice</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {error}. Ensure the Node.js backend or Docker container is active on port 8000.
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={fetchData}>
                Retry
              </button>
            </div>
          )}

          {/* Content View: Table vs Kanban */}
          {viewMode === 'table' ? (
            <div className="table-card">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Task Details</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Tags</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="state-box">
                          <Kanban size={32} />
                          <div style={{ fontWeight: '600' }}>No tasks found in this view</div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Try adjusting your filters or click "Seed Demo Tasks" to populate sample sprint items.
                          </p>
                          <button className="btn btn-primary" onClick={handleSeedData}>
                            <Sparkles size={14} /> Seed Sample Tasks
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id || task._id}>
                        <td>
                          <div className="task-title-cell">
                            <span className="task-title-text">{task.title}</span>
                            {task.description && (
                              <span className="task-desc-text">{task.description}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <select
                            className={`custom-select ${getStatusBadgeClass(task.status)}`}
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id || task._id, e.target.value)}
                            style={{ cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td>
                          <span className={getPriorityBadgeClass(task.priority)}>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <div className="assignee-pill">
                            <div className="avatar-sm">
                              {task.assignee ? task.assignee.slice(0, 2).toUpperCase() : 'DE'}
                            </div>
                            <span>{task.assignee || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="tags-group">
                            {task.tags && task.tags.map((tag, i) => (
                              <span key={i} className="tag-badge">#{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleDeleteTask(task.id || task._id)}
                            style={{ padding: '0.35rem 0.6rem', color: '#f43f5e' }}
                            title="Delete Task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Kanban Board View */
            <div className="kanban-grid">
              {[
                { key: 'backlog', label: 'Backlog', color: '#94a3b8' },
                { key: 'todo', label: 'To Do', color: '#60a5fa' },
                { key: 'in_progress', label: 'In Progress', color: '#fbbf24' },
                { key: 'review', label: 'Review', color: '#c084fc' },
                { key: 'done', label: 'Done', color: '#34d399' },
              ].map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="kanban-column">
                    <div className="kanban-col-header">
                      <div className="kanban-col-title">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                        {col.label}
                      </div>
                      <span className="kanban-col-count">{colTasks.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {colTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          No tasks in {col.label}
                        </div>
                      ) : (
                        colTasks.map((task) => (
                          <div key={task.id || task._id} className="kanban-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span className={getPriorityBadgeClass(task.priority)}>
                                {task.priority}
                              </span>
                              <button
                                onClick={() => handleDeleteTask(task.id || task._id)}
                                style={{ background: 'none', color: 'var(--text-muted)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{task.title}</div>
                            {task.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {task.description}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                              <div className="assignee-pill">
                                <div className="avatar-sm" style={{ width: 20, height: 20, fontSize: '0.6rem' }}>
                                  {task.assignee ? task.assignee.slice(0, 2).toUpperCase() : 'DE'}
                                </div>
                                <span style={{ fontSize: '0.75rem' }}>{task.assignee}</span>
                              </div>
                              <select
                                className="custom-select"
                                value={task.status}
                                onChange={(e) => handleUpdateStatus(task.id || task._id, e.target.value)}
                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                              >
                                <option value="backlog">Backlog</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Create DevOps Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g., Configure AWS EKS Cluster with Terraform"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Technical scope, prerequisites, or acceptance criteria"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-select"
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., DevOps Lead"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tags (comma separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="terraform, aws, eks"
                      value={newTask.tags}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Work Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
