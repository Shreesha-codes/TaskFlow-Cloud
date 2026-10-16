# TaskFlow Cloud — Architecture Specification

This document provides a detailed overview of the system architecture, infrastructure design, continuous delivery pipelines, and observability model for the **TaskFlow Cloud** platform.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph Client ["Client Layer"]
        User["Developer / End User"]
    end

    subgraph IngressLayer ["Ingress & Routing (Port 80 / 443)"]
        Ingress["Nginx Ingress Controller<br/>taskboard.local"]
    end

    subgraph K8sCluster ["Kubernetes Cluster (Namespace: taskboard)"]
        subgraph FrontendGroup ["Frontend Tier"]
            F_Svc["Frontend ClusterIP Service<br/>Port 80"]
            F_Pod1["Frontend Pod 1<br/>Nginx + React"]
            F_Pod2["Frontend Pod 2<br/>Nginx + React"]
        end

        subgraph BackendGroup ["Backend Tier"]
            B_Svc["Backend ClusterIP Service<br/>Port 8000"]
            B_Pod1["Backend Pod 1<br/>Node.js / Express"]
            B_Pod2["Backend Pod 2<br/>Node.js / Express"]
            HPA["Horizontal Pod Autoscaler<br/>Min: 2, Max: 6 (CPU 75%)"]
        end

        subgraph DatabaseGroup ["Persistence Tier"]
            DB_Svc["MongoDB ClusterIP Service<br/>Port 27017"]
            DB_Pod["MongoDB 7.0 StatefulSet / Pod"]
            PVC["PersistentVolumeClaim<br/>5Gi Storage"]
        end
    end

    subgraph MonitoringNamespace ["Observability Stack (Namespace: monitoring)"]
        Prometheus["Prometheus Server"]
        Grafana["Grafana Dashboards"]
        SM["ServiceMonitor<br/>(Scrapes /metrics)"]
    end

    %% Client Interactions
    User -->|HTTP Requests| Ingress

    %% Ingress Routing
    Ingress -->|"Route / (Static SPA)"| F_Svc
    Ingress -->|"Route /api, /health, /ready, /metrics"| B_Svc

    %% Service to Pods
    F_Svc --> F_Pod1
    F_Svc --> F_Pod2
    B_Svc --> B_Pod1
    B_Svc --> B_Pod2
    HPA -.->|Controls Replicas| BackendGroup

    %% Backend to Database
    B_Pod1 -->|Mongoose Connection| DB_Svc
    B_Pod2 -->|Mongoose Connection| DB_Svc
    DB_Svc --> DB_Pod
    DB_Pod --- PVC

    %% Observability Flow
    SM -->|Discovers & Scrapes| B_Svc
    Prometheus -->|Collects Metrics via| SM
    Grafana -->|Queries PromQL| Prometheus
```

---

## 2. Component Architecture

### A. Frontend Layer
- **Framework:** React 18, Vite, Lucide React icons, Vanilla CSS design system.
- **Packaging:** Multi-stage Docker build:
  1. *Build Stage:* `node:20-alpine` runs `npm run build` to compile the Single Page Application.
  2. *Runtime Stage:* `nginx:1.27-alpine` serves optimized static HTML, JavaScript, and CSS assets.
- **Reverse Proxy:** Embedded Nginx configuration handles local API proxying (`/api` $\rightarrow$ `backend:8000`) and operational probes (`/health`, `/ready`).
- **Security:** Runs as an unprivileged, non-root user.

### B. Backend API Layer
- **Framework:** Node.js (v20) and Express REST API framework.
- **Key Modules:**
  - `taskRoutes.js`: Full CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`) with request validation.
  - `opsRoutes.js`: Exposes `/health` (liveness), `/ready` (dependency check on MongoDB), and `/metrics` (Prometheus exposition).
  - `metrics.js`: Collects default process metrics (CPU, memory, event loop lag) and custom HTTP duration histograms via `prom-client`.
- **Security:** Runs inside container as unprivileged `nodejs` user (`UID 1001`).

### C. Database Layer
- **Engine:** MongoDB 7.0 (Jammy).
- **Persistence:** Mounted onto persistent storage volume (`5Gi`) to ensure zero state loss across pod restarts and deployments.
- **Connectivity:** Accessed strictly through internal Kubernetes ClusterIP DNS (`mongodb://taskboard-mongodb:27017/taskboard`).

---

## 3. DevOps & CI/CD Pipeline Architecture

```mermaid
flowchart LR
    Dev([Developer]) -->|Git Commit & Push| GH[GitHub Repository]
    
    subgraph GitHubActions ["GitHub Actions Automation Engine"]
        T[Job 1: Automated Tests<br/>Jest & Supertest]
        Sec[Job 2: Container Security<br/>Aqua Trivy Vulnerability Scan]
        Build[Job 3: Docker Build<br/>Multi-Stage Build Engine]
        Pub[Job 4: Publish GHCR<br/>Tagged with Commit SHA]
    end

    subgraph GHCR ["GitHub Container Registry"]
        Pkg[ghcr.io/shreesha-codes/taskflow-cloud/*]
    end

    subgraph DeployPhase ["Cluster Deployment Phase"]
        Helm[Helm Upgrade & Install]
        K8s[Kubernetes Cluster]
    end

    GH -->|Webhook Trigger| T
    T -->|On Pass| Sec
    Sec -->|No High/Critical CVEs| Build
    Build --> Pub
    Pub --> Pkg
    Pkg -.->|Pull Image by SHA Tag| Helm
    Helm --> K8s
```

1. **Quality Gate:** Jest regression tests execute automatically. Any unit or integration failure immediately halts the build.
2. **DevSecOps Gate:** Aqua Security Trivy scans both frontend and backend images for OS and application package vulnerabilities. Builds fail on unpatched `HIGH` or `CRITICAL` severity CVEs.
3. **Immutability:** Docker images are tagged with the specific Git commit SHA (e.g., `sha-a2327a0`) rather than mutable `latest` tags, guaranteeing reproducible deployments.

---

## 4. Cloud Infrastructure Architecture (Terraform AWS)

```mermaid
graph TB
    subgraph AWS ["AWS Cloud (ap-south-1)"]
        subgraph VPC ["VPC: 10.0.0.0/16 (TaskFlow-Cloud)"]
            IGW["Internet Gateway"]
            NAT["NAT Gateway + Elastic IP"]

            subgraph PublicSubnets ["Public Subnets"]
                Pub1["Subnet 10.0.1.0/24 (ap-south-1a)"]
                Pub2["Subnet 10.0.2.0/24 (ap-south-1b)"]
                Pub3["Subnet 10.0.3.0/24 (ap-south-1c)"]
                ALB["Application Load Balancer"]
            end

            subgraph PrivateSubnets ["Private Subnets"]
                Priv1["Subnet 10.0.11.0/24 (ap-south-1a)"]
                Priv2["Subnet 10.0.12.0/24 (ap-south-1b)"]
                Priv3["Subnet 10.0.13.0/24 (ap-south-1c)"]
                
                subgraph EKS ["Amazon EKS Cluster: taskboard-eks"]
                    CP["Managed Control Plane (K8s v1.30)"]
                    NG["Managed Node Group (t3.medium)<br/>Desired: 2, Min: 1, Max: 4"]
                end
            end
        end
    end

    IGW <--> PublicSubnets
    PublicSubnets --> NAT
    NAT --> PrivateSubnets
    ALB --> EKS
    CP --- NG
```

- **VPC & Subnets:** Isolated multi-AZ design spanning 3 availability zones with dedicated public and private subnet pairs.
- **Compute:** Amazon EKS cluster with private worker nodes in managed node groups to isolate compute workloads from direct public exposure.
- **Network Security:** Public subnets route egress through an Internet Gateway; private subnets route outbound traffic securely through a NAT Gateway.
- **IAM Policies:** Granular IAM execution roles attached to control plane and worker nodes with least-privilege policies (`AmazonEKSClusterPolicy`, `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`).

---

## 5. Observability & Telemetry Model

```mermaid
flowchart TD
    App[Backend API Service<br/>Node.js + prom-client] -->|Exposes /metrics| Endpoint[HTTP Endpoint :8000/metrics]
    
    subgraph PrometheusStack ["Prometheus Operator Ecosystem"]
        SM[ServiceMonitor CRD<br/>interval: 15s]
        PromEngine[Prometheus Server]
        GrafanaUI[Grafana Dashboards]
    end

    Endpoint -->|Scraped by| SM
    SM --> PromEngine
    PromEngine -->|PromQL Querying| GrafanaUI
    
    GrafanaUI --> P1["HTTP Request Rate (req/sec)"]
    GrafanaUI --> P2["P95 Latency (Seconds)"]
    GrafanaUI --> P3["Pod CPU Utilization"]
    GrafanaUI --> P4["HPA Current Replicas"]
```

- **Metrics Collection:** Prometheus scrapes the `/metrics` endpoint every 15 seconds via declarative Kubernetes `ServiceMonitor` resources.
- **Visualization:** Pre-configured Grafana dashboards provide operational visibility into request throughput, latency distribution, backend CPU load, and horizontal pod autoscaler (HPA) replica scaling.
