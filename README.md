# TaskFlow Cloud — DevOps Cloud-Native Capstone

[![CI/CD Pipeline](https://github.com/Shreesha-codes/TaskFlow-Cloud/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Shreesha-codes/TaskFlow-Cloud/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.30-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Terraform](https://img.shields.io/badge/Terraform-AWS-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Trivy](https://img.shields.io/badge/Security-Trivy_0_Critical-00B4D8?logo=aquasec&logoColor=white)](https://trivy.dev/)

---

## Student & Project Metadata

- **Student Name:** Shreesha Sathish
- **UID / Registration No:** 24bcs10488
- **Project Name:** TaskFlow Cloud (TaskBoard MERN DevOps)
- **Repository:** [https://github.com/Shreesha-codes/TaskFlow-Cloud](https://github.com/Shreesha-codes/TaskFlow-Cloud)
- **Comprehensive Project Report:** [project_report.md](https://github.com/Shreesha-codes/TaskFlow-Cloud/blob/main/project_report.md)
- **System Architecture Specification:** [architecture.md](https://github.com/Shreesha-codes/TaskFlow-Cloud/blob/main/architecture.md)
- **Project Presentation Deck (Google Slides / PPT):** [View Presentation on Google Drive](https://drive.google.com/file/d/1_4-4tk-R7lkkAdwa2xK-n49QL-jysc_z/view?usp=sharing)

---

## Executive Summary

**TaskFlow Cloud** is an enterprise-grade, cloud-native DevOps capstone platform built using a full-stack MERN (MongoDB, Express, React, Node.js) architecture. The project demonstrates an end-to-end implementation of the modern software delivery lifecycle:

```
Developer Commit → Jest Testing Gate → Trivy DevSecOps → Multi-Stage Docker → GHCR Registry (Commit SHA) → Terraform AWS IaC → Kubernetes Helm Deployment → Prometheus & Grafana Observability
```

---

## Complete Project Directory Structure

```text
TaskFlow-Cloud/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                   # Automated CI/CD pipeline (Tests, Trivy, Docker build, GHCR push)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # Mongoose connection & MongoDB readyState probe logic
│   │   ├── docs/                       # API documentation assets
│   │   ├── middleware/
│   │   │   └── metrics.js              # Prometheus prom-client middleware (HTTP duration & metrics)
│   │   ├── models/
│   │   │   └── Task.js                 # Mongoose schema and model for sprint tasks
│   │   ├── routes/
│   │   │   ├── opsRoutes.js            # /health (Liveness), /ready (Readiness), /metrics, /docs
│   │   │   └── taskRoutes.js           # REST CRUD API endpoints (GET, POST, PUT, DELETE)
│   │   ├── app.js                      # Express application setup, routes, and middleware
│   │   └── server.js                   # Server initialization, DB connection, and graceful shutdown
│   ├── tests/
│   │   ├── health.test.js              # Automated Jest tests for operational probes
│   │   └── tasks.test.js               # Automated Jest integration tests for task CRUD operations
│   ├── .dockerignore                   # Ignores local node_modules, logs, and temp files
│   ├── Dockerfile                      # Production Dockerfile running as non-root unprivileged user
│   └── package.json                    # Backend dependencies, Jest configuration, and scripts
├── frontend/
│   ├── public/                         # Static assets and favicon
│   ├── src/
│   │   ├── assets/                     # Frontend logos and images
│   │   ├── components/                 # React UI components (Kanban Board, Task Cards, Modals)
│   │   ├── App.jsx                     # Core application view with sprint board and metrics
│   │   ├── index.css                   # Custom Vanilla CSS design tokens, themes, and animations
│   │   └── main.jsx                    # React 18 DOM mount point
│   ├── .dockerignore                   # Ignores node_modules, build cache, and dev files
│   ├── Dockerfile                      # Multi-stage Dockerfile (Node.js build + Alpine Nginx runtime)
│   ├── index.html                      # HTML5 entry template
│   ├── nginx.conf                      # Embedded Nginx reverse proxy (/api -> backend:8000)
│   ├── package.json                    # Frontend dependencies (React, Vite, Lucide icons)
│   └── vite.config.js                  # Vite build tool and development proxy configuration
├── helm/
│   └── taskboard/
│       ├── templates/
│       │   ├── _helpers.tpl            # Helm template naming and label helpers
│       │   ├── backend.yaml            # Backend Deployment and ClusterIP Service manifests
│       │   ├── frontend.yaml           # Frontend Deployment and ClusterIP Service manifests
│       │   ├── hpa.yaml                # HorizontalPodAutoscaler manifest (min: 2, max: 6, CPU 75%)
│       │   ├── ingress.yaml            # Nginx Ingress routing taskboard.local to services
│       │   ├── mongodb.yaml            # MongoDB StatefulSet/Deployment and ClusterIP Service
│       │   └── servicemonitor.yaml     # Prometheus Operator ServiceMonitor custom resource
│       ├── Chart.yaml                  # Helm Chart definition and metadata (v1.0.0)
│       └── values.yaml                 # Configurable values (replicas, ports, ingress, resources)
├── k8s/
│   └── namespace.yaml                  # Kubernetes namespace definition (taskboard)
├── monitoring/
│   └── prometheus-grafana-values.yaml  # Helm values for kube-prometheus-stack and Grafana dashboard
├── scripts/
│   └── load-test.sh                    # Automated shell script to generate traffic for metrics & HPA
├── terraform/
│   ├── eks.tf                          # Amazon EKS cluster, node groups, and IAM security roles
│   ├── main.tf                         # Terraform required providers and AWS provider configuration
│   ├── outputs.tf                      # Terraform outputs (VPC ID, EKS endpoint, kubectl config)
│   ├── terraform.tfvars.example        # Sanitized variable template without credentials
│   ├── variables.tf                    # Configurable variables (region, CIDRs, node types, AZs)
│   └── vpc.tf                          # AWS VPC, 3 public subnets, 3 private subnets, IGW, and NAT
├── architecture.md                     # Comprehensive system architecture & Mermaid diagrams
├── docker-compose.yml                  # 3-Tier local orchestration (frontend, backend, mongodb)
├── grading.md                          # Capstone rubric & submission verification standard
├── project_report.md                   # Evidence report containing all M1-M9 deliverables & screenshots
└── README.md                           # Master project documentation
```

---

## Architectural Highlights & Module Mapping

| Module | Core Technology | Implementation Details |
| :--- | :--- | :--- |
| **M1: Application** | React 18, Node.js, Express, MongoDB | Full CRUD Kanban UI, `/health`, `/ready`, persistent database schema |
| **M2: Testing** | Jest, Supertest | 10 passing test cases covering REST routes and mock DB isolation |
| **M3: Git & GitHub** | Git, GitHub | Semantic commit history (10+ commits), strict `.gitignore` |
| **M4: Docker** | Docker, Docker Compose | Multi-stage frontend, unprivileged non-root backend, healthy Compose stack |
| **M5: CI/CD** | GitHub Actions, GHCR | Automated pipeline on push, immutable Git commit SHA tagging |
| **M6: DevSecOps** | Aqua Security Trivy | Container image scanning for OS/package CVEs, 0 blocking criticals |
| **M7: Terraform** | Terraform, AWS VPC, EKS | Multi-AZ VPC across 3 AZs, private EKS node group, clean `destroy` |
| **M8: Kubernetes & Helm** | Helm v3, Kubernetes, Ingress | Declarative Helm chart, 2+ replicas, probes, Ingress routing at `taskboard.local` |
| **M9: Observability** | Prometheus, Grafana, prom-client | `/metrics` scraping via `ServiceMonitor`, real-time CPU & replica dashboards |
| **M10: Presentation** | Markdown, Google Slides | Comprehensive README, architectural spec, project report, and slide deck |

---

## Quickstart & Local Execution

### 1. Run with Docker Compose
To run the full multi-tier containerized stack locally:

```bash
# Clone the repository
git clone https://github.com/Shreesha-codes/TaskFlow-Cloud.git
cd TaskFlow-Cloud

# Build and start all services in detached mode
docker compose up -d --build

# Verify container status
docker compose ps
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
- **Prometheus Metrics:** [http://localhost:8000/metrics](http://localhost:8000/metrics)

---

### 2. Run Automated Tests
```bash
cd backend
npm install
npm test
```

---

### 3. Deploy to Kubernetes using Helm

```bash
# 1. Create the namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy TaskFlow Cloud Helm chart
helm upgrade --install taskboard ./helm/taskboard -n taskboard

# 3. Verify pods and services
kubectl get pods,svc -n taskboard
```

---

### 4. Deploy Prometheus & Grafana Monitoring

```bash
# 1. Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 2. Deploy Prometheus Operator and Grafana
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f monitoring/prometheus-grafana-values.yaml

# 3. Enable ServiceMonitor in TaskFlow
helm upgrade --install taskboard ./helm/taskboard -n taskboard --set metrics.serviceMonitor.enabled=true

# 4. Access Dashboards
# Prometheus UI
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
# Grafana UI (admin / admin)
kubectl port-forward svc/prometheus-grafana 3001:80 -n monitoring
```

---

## Infrastructure as Code (Terraform AWS)

```bash
cd terraform

# 1. Initialize Terraform
terraform init

# 2. Validate HCL syntax
terraform validate

# 3. Review planned infrastructure (28 AWS resources)
terraform plan

# 4. Clean teardown verification
terraform destroy
```

---

## Project Documentation & Deliverable Links

1. **[Comprehensive Project Report (Evidence & Screenshots)](https://github.com/Shreesha-codes/TaskFlow-Cloud/blob/main/project_report.md)** — Contains verified screenshots, terminal outputs, and audit logs for Modules M1 through M9.
2. **[System Architecture Specification](https://github.com/Shreesha-codes/TaskFlow-Cloud/blob/main/architecture.md)** — Architectural breakdowns with high-resolution Mermaid diagrams.
3. **[Presentation Slides Deck](https://drive.google.com/file/d/1_4-4tk-R7lkkAdwa2xK-n49QL-jysc_z/view?usp=sharing)** — Complete slide-by-slide presentation deck.
4. **[Grading Rubric](https://github.com/Shreesha-codes/TaskFlow-Cloud/blob/main/grading.md)** — Session 21 DevOps Final Capstone criteria and submission checklist.

---

## License

This project is open-source and licensed under the [MIT License](LICENSE).
