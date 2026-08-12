# 🤖 REVU — AI Code Reviewer (v4 Operational Edition)

A FastAPI backend and React single-page application built for CS education research, combining multi-language static analysis (`pylint`, `bandit`, `cpplint`) with NVIDIA NIM pedagogical feedback.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose **OR** Python 3.11+ and Node.js 20+

### Option A: Docker Compose (Recommended)
Launch the backend, Prometheus, and Grafana in containerized isolation:
```bash
docker-compose up --build
```
- **REVU Application & API**: `http://localhost:7860`
- **Prometheus Metrics**: `http://localhost:9090`
- **Grafana Dashboard**: `http://localhost:3000` (Default login: `admin` / `admin`)

### Option B: Local Environment Setup
```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env

# 3. Start API server
python app.py
```

---

## 🏗️ Infrastructure as Code (Terraform)

Terraform configurations are located in `terraform/` for provisioning free-tier Web Services (Render / Cloud Container hosting).

### Terraform Commands
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your API keys

terraform init
terraform plan
terraform apply
```

*Note*: `.tfvars` files are strictly gitignored to prevent secret leaks.

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The repository features two distinct GitHub Actions workflows:

1. **Continuous Integration (`.github/workflows/ci.yml`)**:
   - Triggers on PRs and feature branch pushes.
   - Installs dependencies, runs `pylint`, executes `pytest` suite (`test_v2.py`, `test_v3.py`), and validates Vite frontend build (`npm run build`).

2. **Continuous Deployment (`.github/workflows/cd.yml`)**:
   - Triggers on merge to `main`.
   - Builds container image, pushes to GitHub Container Registry (`ghcr.io`), and triggers deployment webhooks.

---

## ☸️ Kubernetes Deployment (k3s / Minikube / Cloud)

Kubernetes manifests are located in `k8s/` for container orchestration beyond local Docker Compose:

```bash
# 1. Apply configuration and secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 2. Deploy backend service and ingress
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service-ingress.yaml
```

**Manifest Summary**:
- `configmap.yaml`: Non-sensitive operational environment parameters.
- `secret.yaml`: API keys and secrets externalized from code.
- `deployment.yaml`: Tuned resource constraints (128Mi-512Mi RAM, 100m-500m CPU) with readiness/liveness health probes (`/health`).
- `service-ingress.yaml`: ClusterIP service exposure and HTTP ingress routing.

---

## 📊 Observability & Operational Metrics

- **Prometheus Endpoint**: `GET /metrics` (returns Prometheus metric vectors when scraped by Prometheus or JSON stats for research analytics).
- **Grafana Dashboard**: Provisioned automatically under `REVU Operations` featuring p95 latency tracking, LLM fallback counters, and HTTP error rate alerts.
- **Alert Rules**: Pre-configured in `monitoring/grafana/provisioning/alerting/alerts.yml` targeting fallback rates >20% and 5xx error spikes.

---

## 📄 API & License

Refer to [API.md](file:///c:/Users/saish/OneDrive/Documents/Pictures/code%20reviewer/API.md) for endpoint signatures and response contracts.

*License*: MIT License.
