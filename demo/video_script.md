# TaskFlow Cloud — Video Walkthrough Recording Script (M10)

This script follows the exact order required by the **M10 Video Evaluation Criteria**.

---

## ⏱️ Video Structure & Timing (Target: ~7–10 Minutes)

| Section | Topic | Estimated Time |
| :--- | :--- | :--- |
| **Part 1** | **PPT Slides Presentation** (What you built + Architecture) | 2 – 3 Mins |
| **Part 2.1** | **Codebase Walkthrough** (Folder structure & key files) | 1 Min |
| **Part 2.2** | **CI/CD Pipeline** (GitHub Actions trigger & end-to-end run) | 1.5 Mins |
| **Part 2.3** | **Terraform** (`terraform plan` & AWS Console VPC + EKS) | 1 Min |
| **Part 2.4** | **ArgoCD** (Synced application & GitOps reconciliation) | 1 Min |
| **Part 2.5** | **Kubernetes** (`kubectl get pods,svc,ingress` healthy status) | 1 Min |
| **Part 2.6** | **Prometheus** (Targets page showing app as `UP`) | 45 Secs |
| **Part 2.7** | **Grafana** (Live dashboard displaying application metrics) | 1 Min |

---

## 🎬 Section-by-Section Speaking Script & Actions

### 1. Present Your PPT Slides (What you built, architecture overview)
> **Screen:** Open your Google Slides / PPT link: [View Presentation](https://drive.google.com/file/d/1_4-4tk-R7lkkAdwa2xK-n49QL-jysc_z/view) in full-screen presentation mode.

**What to Say:**
- *"Hello everyone, my name is Shreesha Sathish (UID: 24bcs10488). Today I am presenting **TaskFlow Cloud**, an enterprise-grade cloud-native DevOps project."*
- **Slide 1-2 (Problem & Solution):**
  - *"TaskFlow is a full-stack MERN task management application that we elevated into a production-grade cloud-native architecture."*
  - *"Our goal was zero manual operations: implementing automated GitOps, rigorous security scanning with Trivy, immutable infrastructure with Terraform on AWS, and end-to-end observability."*
- **Slide 3-4 (Architecture & Lifecycle):**
  - *"Here is the high-level architecture: Whenever a developer commits code, GitHub Actions executes unit tests via Jest, performs Trivy vulnerability scans, builds multi-stage Docker images, and publishes them to GitHub Container Registry tagged with immutable commit SHAs."*
  - *"For infrastructure, we use Terraform to provision a dedicated AWS VPC, subnets, and an EKS cluster."*
  - *"Deployment is managed declaratively through Kubernetes manifests and Helm charts via ArgoCD, while Prometheus and Grafana continuously monitor our cluster health and application metrics."*

---

### 2. Live Walkthrough

#### 2.1 Codebase — Folder Structure & Key Files
> **Screen:** Open VS Code / Antigravity with your project root open.

**What to Show:**
- Expand the directory tree:
  - `backend/` & `frontend/` (MERN application code, Dockerfiles)
  - `.github/workflows/ci-cd.yml` (Automated pipeline)
  - `terraform/` (AWS VPC, EKS, and IAM configuration)
  - `k8s/` & `helm/` (Kubernetes deployments, services, ingress)
  - `monitoring/` (Prometheus alerting rules and Grafana dashboards)

**What to Say:**
- *"Moving to our repository structure: Here we have our containerized `backend` and `frontend` applications with optimized multi-stage Dockerfiles."*
- *"Under `terraform/`, all infrastructure is defined as code. Under `k8s/` and `helm/`, we have production Kubernetes manifests including resource requests/limits, liveness/readiness probes, and ingress rules."*

---

#### 2.2 CI/CD — Trigger a Push & Show GitHub Actions End-to-End
> **Screen:** Terminal & GitHub Actions tab (`https://github.com/Shreesha-codes/TaskFlow-Cloud/actions`).

**Action to Perform:**
1. Make a small harmless change (e.g., adding a comment or whitespace in a README or frontend file).
2. Commit and push:
   ```bash
   git add .
   git commit -m "ci: trigger automated CI/CD pipeline verification"
   git push origin main
   ```
3. Switch immediately to the **GitHub Actions** tab in your browser.
4. Click on the active workflow run and display the workflow stages.

**What to Say:**
- *"I am now pushing a commit to trigger our automated GitHub Actions workflow."*
- *"Notice the stages executing in parallel and sequence: Jest unit tests are verified, Trivy scans the codebase and containers for CVE vulnerabilities with zero criticals allowed, and the Docker images are built and pushed to GitHub Container Registry (GHCR) tagged with the exact Git commit SHA for immutability."*

---

#### 2.3 Terraform — `terraform plan` Output & AWS Console (VPC + EKS)
> **Screen:** Terminal inside `terraform/` directory, then switch to AWS Management Console.

**Action to Perform:**
1. Run in terminal:
   ```bash
   cd terraform
   terraform plan
   ```
2. Show the plan output summarizing resource states.
3. Switch to your browser showing **AWS Console**:
   - Navigate to **VPC Console** (highlight VPC, subnets, route tables).
   - Navigate to **EKS Console** (highlight active EKS cluster and node groups).

**What to Say:**
- *"Here is our `terraform plan` output showing our desired state matches our infrastructure without configuration drift."*
- *"In the AWS Console, you can see our custom VPC with isolated private and public subnets, internet gateways, and our active EKS cluster running on managed worker nodes."*

---

#### 2.4 ArgoCD — Synced Application & GitOps Flow
> **Screen:** ArgoCD Web UI dashboard.

**Action to Perform:**
- Show the `taskflow-cloud` application tile in ArgoCD.
- Click into the application tree to show the synchronized status:
  - **Status:** `Synced` & `Healthy` (green hearts).
  - Show the Git commit SHA that ArgoCD is currently reconciled with.

**What to Say:**
- *"Here is the ArgoCD web console. Our application is configured using GitOps. ArgoCD continuously monitors our repository and automatically reconciles any state changes."*
- *"You can see the application status is completely Synced and Healthy, showing all Deployments, Services, and Ingress resources matching the Git repository."*

---

#### 2.5 Kubernetes — `kubectl get pods, services, ingress` Healthy Status
> **Screen:** Terminal connected to your Kubernetes cluster.

**Action to Perform:**
Run the following commands:
```bash
kubectl get pods -n taskflow
kubectl get svc -n taskflow
kubectl get ingress -n taskflow
```
*(Or without `-n taskflow` if deployed in default namespace)*:
```bash
kubectl get pods,svc,ingress -o wide
```

**What to Say:**
- *"Let's verify our live Kubernetes cluster directly using `kubectl`."*
- *"All backend and frontend pods are in the `Running` state with 0 restarts. Ready checks (liveness and readiness probes) have passed."*
- *"Our ClusterIP and Ingress services are actively routing traffic to healthy pods."*

---

#### 2.6 Prometheus — Targets Page Showing App as `UP`
> **Screen:** Prometheus UI (`http://<prometheus-ip>:9090/targets` or port-forwarded).

**Action to Perform:**
1. Navigate to **Status → Targets** in Prometheus.
2. Filter/scroll to your application targets (`backend`, `frontend`, node-exporter).
3. Highlight the green badge showing state **`UP` (1/1)**.

**What to Say:**
- *"Switching to Prometheus: Looking at the Targets dashboard, all our endpoints—including the Node.js backend metrics endpoint—are actively being scraped and are in the `UP` state with a healthy 100% scrape rate."*

---

#### 2.7 Grafana — Live Dashboard with Application Metrics
> **Screen:** Grafana UI showing the TaskFlow Cloud / Cluster Performance Dashboard.

**Action to Perform:**
- Open the dashboard showing:
  - CPU & Memory utilization graphs
  - HTTP Request Rates / Response Latency / Status Codes (2xx, 4xx, 5xx)
  - Pod container status & uptime
- Interact with the time range selector (e.g., set to "Last 15 minutes") or make an API request in another tab to show live metric activity.

**What to Say:**
- *"Finally, here is our Grafana monitoring dashboard. It aggregates metrics scraped by Prometheus to give us real-time operational visibility."*
- *"We can observe live CPU and memory utilization, HTTP request rates, response times, and cluster health in real time."*
- *"This concludes the end-to-end demonstration of TaskFlow Cloud, covering automated CI/CD, IaC, GitOps, Kubernetes orchestration, and observability. Thank you!"*

---

## 📌 Checklist Before You Hit Record:
- [ ] PPT presentation open in browser and shared to full screen.
- [ ] Browser tabs pre-opened: GitHub Actions, AWS Console, ArgoCD, Prometheus (`/targets`), Grafana.
- [ ] Terminal ready with `kubectl` and `terraform` pre-authenticated.
- [ ] Audio & microphone tested.
