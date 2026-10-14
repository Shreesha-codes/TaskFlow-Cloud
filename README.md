# TaskFlow Cloud — DevOps Final Capstone: TaskBoard (MERN Stack)

## 1. What We Are Building
**TaskBoard** is a production-grade, SaaS-style project management and sprint tracking application engineered as an end-to-end cloud-native capstone. It demonstrates the journey of a modern cloud application from a developer workstation to a secure, monitored Kubernetes deployment on AWS.

- **Frontend:** React 18 + Vite (Responsive SaaS UI, dark sidebar, KPI metrics, dynamic filters, modal workflows)
- **Backend:** Node.js (v20/v24) + Express REST APIs
- **Database:** MongoDB with Mongoose ODM & connection pooling
- **Telemetry & Probes:** Native Prometheus metrics (`prom-client`), Liveness (`/health`), and Readiness (`/ready`) probes
- **Automated Tests:** Jest + Supertest + in-memory MongoDB quality gate
- **Containerization:** Multi-stage Docker builds (least-privilege non-root `node` backend, lightweight Nginx reverse proxy frontend)
- **Local Multi-Container Stack:** Docker Compose orchestrating Frontend, Backend, and MongoDB
- **DevSecOps CI/CD:** GitHub Actions pipeline running test gates, Docker Buildx, and Trivy CVE scanning
- **Security Scanning:** Aqua Security Trivy container scanning (blocking on CRITICAL/HIGH vulnerabilities)
- **Container Registry:** GitHub Container Registry (`ghcr.io`) with SHA & semantic versioning
- **Infrastructure as Code (IaC):** Terraform for AWS VPC, Subnets, NAT Gateways, and EKS Cluster
- **Orchestration & Packaging:** Kubernetes manifests & Helm charts (`helm/taskboard`)
- **Traffic Routing:** Nginx Ingress Controller
- **Autoscaling:** Horizontal Pod Autoscaler (HPA) targeting CPU utilization
- **Monitoring & Observability:** Prometheus ServiceMonitor metrics scraping & Grafana visualization dashboards
- **Reliability & Chaos Drills:** Deliberately broken manifests for real-world SRE troubleshooting

```text
Developer Laptop
       │
       ▼
Git / GitHub
       │
       ▼
GitHub Actions (CI/CD Quality Gates)
       ├─► Jest Backend Tests + In-Memory MongoDB
       ├─► Vite Frontend Production Compilation
       ├─► Docker Multi-Stage Image Builds
       ├─► Trivy Container Security Scanning (HIGH/CRITICAL)
       └─► Push Images to GitHub Container Registry (ghcr.io)
              │
              ▼
        Terraform (IaC)
              │
       AWS VPC + Managed EKS
              │
              ▼
          Helm Chart
              │
      ┌───────┴────────┐
      │                │
   Frontend          Backend
 React + Nginx    Node.js + Express
      │                │
      └───────┬────────┘
              ▼
           MongoDB
              │
       Prometheus (Scraping /metrics)
              │
           Grafana (Dashboards)
```

---

## 2. Repository Structure

```text
TaskFlow-Cloud/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # DevSecOps CI/CD pipeline (Test, Trivy Scan, GHCR Push)
├── backend/                      # Express REST API application
│   ├── src/
│   │   ├── config/               # MongoDB connection logic & readiness probe helper
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middleware/           # Prometheus telemetry middleware
│   │   ├── models/               # Mongoose Task schema and indexes
│   │   ├── routes/               # Task REST endpoints and DevOps opsRoutes
│   │   ├── docs/                 # OpenAPI 3.0 / Swagger specification
│   │   └── server.js             # Express lifecycle & graceful shutdown
│   ├── tests/                    # Jest + Supertest integration tests
│   ├── Dockerfile                # Multi-stage production container (Node 20 Alpine, non-root)
│   └── .dockerignore             # Excludes node_modules, tests, logs from image build
├── frontend/                     # React + Vite client
│   ├── src/                      # UI components, dashboard layout, API client
│   ├── nginx.conf                # Nginx reverse proxy configuration & Gzip compression
│   ├── Dockerfile                # Multi-stage build (Vite build -> Nginx Alpine runtime)
│   └── .dockerignore             # Lean build context
├── docker-compose.yml            # Full multi-container stack (Frontend, Backend, MongoDB)
├── progress/                     # Milestone completion documentation
│   ├── part-1-completion.md      # MERN foundation, testing, and observability
│   ├── part-2-completion.md      # Containerization and Docker Compose
│   └── part-3-completion.md      # DevSecOps CI/CD and Trivy scanning
├── terraform/                    # AWS VPC + EKS Infrastructure as Code (Part 4)
├── helm/taskboard/               # Kubernetes Helm deployment package (Part 5)
├── k8s/                          # Kubernetes namespace and bootstrap manifests
├── monitoring/                   # Prometheus & Grafana scrape configs and dashboards
├── troubleshooting/              # Deliberately broken manifests for troubleshooting labs
└── scripts/                      # Load generation and chaos scripts
```

---

## PART A — Application Architecture

### 3. Frontend (React + Vite + Nginx)
The frontend is modeled as a modern enterprise SaaS dashboard:
- Dark sidebar navigation with workspace selection
- Real-time KPI summary cards (Total Tasks, In Progress, Urgent, Completed)
- Task management board with status filtering (`all`, `backlog`, `todo`, `in_progress`, `review`, `done`)
- Priority tags (`urgent`, `high`, `medium`, `low`)
- Interactive create-task modal and seed sprint button
- Built-in operational health indicator (pings backend `/health`)
- Responsive CSS styling with smooth transitions and glassmorphism accents

The client communicates through relative endpoints (`/api/tasks`, `/api/tasks/stats`, `/health`). Nginx reverse proxies these calls directly to the backend service, abstracting internal networking and avoiding CORS complexity.

### 4. Backend (Node.js + Express + MongoDB)
The REST API provides operational endpoints and task management resources:

| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/` | `GET` | Service metadata, environment, route directory |
| `/health` | `GET` | **Liveness Probe**: Process status, memory RSS, and uptime |
| `/ready` | `GET` | **Readiness Probe**: MongoDB active connectivity state (200 OK / 503 Service Unavailable) |
| `/metrics` | `GET` | **Prometheus Telemetry**: Scrapes HTTP request counters and response latency histograms |
| `/docs` | `GET` | Swagger UI documentation |
| `/api/tasks` | `GET` | Query tasks with filtering by status, priority, search text, and sorting |
| `/api/tasks` | `POST` | Create a new task with validation |
| `/api/tasks/stats` | `GET` | Aggregated metrics (totals, status/priority breakdown, completion percentage) |
| `/api/tasks/:id` | `GET` | Retrieve single task by ID |
| `/api/tasks/:id` | `PUT` | Update task fields or transition status |
| `/api/tasks/:id` | `DELETE` | Delete task |
| `/api/tasks/seed` | `POST` | Pre-populate realistic sprint sample tasks |

---

## PART B — Running Locally

### 5. Fastest Method: Docker Compose
Spin up the entire stack (React frontend, Express backend, and MongoDB database) with one command:

```bash
docker compose up --build
```

**Access URLs:**
- Frontend Web App: [http://localhost:3000](http://localhost:3000)
- Backend Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Liveness Probe: [http://localhost:8000/health](http://localhost:8000/health)
- Readiness Probe: [http://localhost:8000/ready](http://localhost:8000/ready)
- Prometheus Metrics: [http://localhost:8000/metrics](http://localhost:8000/metrics)

**Stop the stack:**
```bash
docker compose down
```

**Stop and clean database volumes:**
```bash
docker compose down -v
```

### 6. Run Directly on Host

#### Prerequisites:
- Node.js 20+
- MongoDB instance running locally (or MongoDB Atlas URI)

#### Backend:
```bash
cd backend
npm install
export MONGO_URI='mongodb://localhost:27017/taskboard'
export PORT=8000
npm run dev
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## PART C — Automated Testing & Quality Gate

Run automated tests before packaging or pushing code:

```bash
cd backend
npm test
```

- Uses **Jest** + **Supertest** + **mongodb-memory-server** for self-contained execution without needing a running external database.
- Validates operational endpoints (`/health`, `/ready`, `/metrics`), input validation, and CRUD operations.
- **Fail-Fast Pipeline Rule:** If any test fails, CI halts immediately and stops container image creation.

---

## PART D — Git & Version Control

```bash
git add .
git commit -m "feat: complete TaskBoard MERN application with CI/CD and Docker stack"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO>
git push -u origin main
```

---

## PART E — Multi-Stage Containerization

### 7. Backend Container (`backend/Dockerfile`)
- **Stage 1 (deps):** Installs isolated production dependencies via `npm ci --only=production`.
- **Stage 2 (runner):** Uses `node:20-alpine`, enforces least-privilege security by running as non-root user `USER node`, includes built-in container `HEALTHCHECK` pinging `/health`.

```bash
docker build -t taskboard-backend:local ./backend
```

### 8. Frontend Container (`frontend/Dockerfile`)
- **Stage 1 (builder):** Compiles React app using `node:20-alpine` and `npm run build`.
- **Stage 2 (runner):** Deploys static build into minimal `nginx:alpine` (~25MB total footprint) with custom reverse proxy and history fallback routing.

```bash
docker build -t taskboard-frontend:local ./frontend
```

---

## PART F — DevSecOps CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) executes three stages:

1. **TEST (Quality Gate):**
   - Installs dependencies with dual caching for backend and frontend.
   - Runs Jest test suite against in-memory MongoDB.
   - Compiles Vite production bundle.
2. **SECURITY SCAN (Aqua Security Trivy):**
   - Builds container images locally using Docker Buildx.
   - Runs Trivy vulnerability scans targeting OS packages and application dependencies for `HIGH` and `CRITICAL` vulnerabilities.
   - Generates SARIF reports and uploads them as workflow artifacts.
3. **PUBLISH (GitHub Container Registry):**
   - Authenticates to `ghcr.io` via `GITHUB_TOKEN`.
   - Tags images with commit short SHA and `:latest`.
   - Pushes production images with GitHub Actions caching enabled.

---

## PART G — Security Scanning (Trivy)

Trivy runs automatically in the CI pipeline:
- Scans `taskboard-backend:${{ github.sha }}` and `taskboard-frontend:${{ github.sha }}`
- Focuses on actionable vulnerabilities (`ignore-unfixed: true`, severities: `CRITICAL,HIGH`)
- Prevents vulnerable dependencies and unpatched base image CVEs from entering production registries.

---

## PART H — Infrastructure as Code with Terraform (Part 4)

Terraform provisions the underlying AWS network and managed Kubernetes platform:
- **AWS VPC:** Custom CIDR with public and private subnets distributed across 3 Availability Zones (AZs).
- **NAT Gateways:** Outbound internet access for private Kubernetes worker nodes.
- **AWS EKS:** Managed control plane with AWS IAM OIDC provider, cluster security groups, and auto-scaling managed node groups.

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

To configure `kubectl` after creation:
```bash
aws eks update-kubeconfig --region ap-south-1 --name taskboard-eks
```

---

## PART I — Kubernetes & Helm Deployment (Part 5)

Deploy the application stack to Kubernetes using the Helm package:

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Deploy Helm chart
helm upgrade --install taskboard ./helm/taskboard \
  --namespace taskboard \
  --create-namespace
```

---

## PART J — Ingress, Autoscaling & Observability

### Ingress Routing
Nginx Ingress controller routes traffic based on host and path:
- `/` ➔ React Frontend Service
- `/api`, `/health`, `/ready`, `/metrics` ➔ Express Backend Service

### Horizontal Pod Autoscaler (HPA)
Monitors backend pod CPU utilization and scales replicas dynamically:
```bash
kubectl get hpa -n taskboard
```

### Prometheus & Grafana Monitoring
- Backend `/metrics` endpoint exports request counters and latency histograms.
- Prometheus ServiceMonitor scrapes telemetry every 15 seconds.
- Grafana visualizes throughput, latency percentiles (p50, p95, p99), error rates, and pod resource saturation.

---

## PART K — SRE Troubleshooting Labs

Practice diagnosing and resolving intentional failure scenarios:
1. **Broken Image (`troubleshooting/broken-image.yaml`):** Diagnose `ImagePullBackOff` via `kubectl describe pod` and fix tag mismatch.
2. **Broken Service (`troubleshooting/broken-service.yaml`):** Identify missing endpoints caused by selector label mismatches using `kubectl get endpoints`.

---

## Milestone Progress Summary

| Phase | Description | Status |
| :---: | :--- | :---: |
| **Part 1** | MERN Application Architecture, REST APIs, Observability & Tests | ✅ **Completed** |
| **Part 2** | Multi-Stage Containerization & Docker Compose Local Stack | ✅ **Completed** |
| **Part 3** | DevSecOps GitHub Actions CI/CD Pipeline & Trivy Container Scanning | ✅ **Completed** |
| **Part 4** | Infrastructure as Code (IaC) with AWS VPC & EKS via Terraform | ⏳ *Up Next* |
| **Part 5** | Kubernetes Helm Deployment, Ingress, HPA & Monitoring | ⏳ Pending |
