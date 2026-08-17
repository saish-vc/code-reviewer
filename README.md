# 🤖 REVU — AI Code Reviewer (v1.0.0 Desktop Edition)

A FastAPI backend and native desktop application (Tauri + React/Vite) built for CS education research, combining multi-language static analysis (`pylint`, `bandit`, `cpplint`) with NVIDIA NIM pedagogical feedback.

---

## 🖥️ Desktop App (Tauri)

REVU is distributed as a native desktop application. The reviewer tool is **no longer available as a hosted web app** — download the installer for your platform from the [GitHub Releases](https://github.com/saish-vc/code-reviewer/releases) page or the Downloads section on the marketing site.

### Platform Installers
| Platform | Format |
|----------|--------|
| Windows  | `.msi` (installer) |
| macOS    | `.dmg` (Apple Silicon + Intel) |
| Linux    | `.AppImage` / `.deb` |

### ⚠️ Unsigned Build Notice
REVU is distributed **without a paid code-signing certificate**. On first launch:
- **Windows**: SmartScreen may warn → click "More info" → "Run anyway"
- **macOS**: Gatekeeper may block → right-click the `.app` → "Open"

This is expected behaviour for free, open-source desktop apps without a commercial certificate.

---

## 🔖 Release Flow (How to Cut a Release)

1. **Bump the version** in both files — they must stay in sync:
   ```
   revu-app/package.json            → "version": "1.x.x"
   revu-app/src-tauri/tauri.conf.json → "version": "1.x.x"
   ```

2. **Commit**:
   ```bash
   git add revu-app/package.json revu-app/src-tauri/tauri.conf.json
   git commit -m "chore: bump version to v1.x.x"
   git push
   ```

3. **Tag and push**:
   ```bash
   git tag v1.x.x
   git push origin v1.x.x
   ```

4. The **GitHub Actions release workflow** (`.github/workflows/release-app.yml`) fires automatically, builds for all three platforms, and publishes the installers as assets on a new GitHub Release.

5. Update `CHANGELOG.md` with release notes.

> **GitHub Secret required**: Set `VITE_API_BASE_URL` as a repository secret in  
> Settings → Secrets and variables → Actions → New repository secret.  
> This is the production backend URL baked into the Vite build (e.g. `https://your-backend.onrender.com`).

---

## 🛠️ Local Development — Desktop App (`revu-app/`)

### Prerequisites
- **Node.js 20+**
- **Rust** (via [rustup](https://rustup.rs/))
- **Windows**: Microsoft C++ Build Tools (MSVC) — install via Visual Studio Installer
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux (Ubuntu/Debian)**: `sudo apt-get install libwebkit2gtk-4.1-dev libgtk-3-dev`

### Steps

```bash
# 1. Install Node dependencies
cd revu-app
npm install

# 2. Copy and fill in the environment file
cp .env.example .env.local
# Edit .env.local and set VITE_API_BASE_URL to your local backend:
# VITE_API_BASE_URL=http://localhost:7860

# 3. Generate app icons from the source image (one-time)
npx tauri icon src-tauri/icons/app-icon-source.jpg

# 4. Start the desktop app in dev mode (opens a native window)
npm run tauri dev
```

The Tauri dev window hot-reloads on frontend changes, exactly like a browser dev server.

---

## 🚀 Quick Start — Backend (Local)

### Option A: Docker Compose (Recommended)
```bash
docker-compose up --build
```
- **API**: `http://localhost:7860`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (admin / admin)

### Option B: Local Python
```bash
pip install -r requirements.txt
cp .env.example .env
# Add your NVIDIA_API_KEY and ALLOWED_ORIGINS to .env
python app.py
```

### CORS Configuration
The backend reads allowed origins from the `ALLOWED_ORIGINS` env var. For the Tauri desktop app, both platform-specific origins must be included:
```
ALLOWED_ORIGINS=http://tauri.localhost,tauri://localhost,http://localhost:5173,http://127.0.0.1:5173,http://localhost:7860,http://127.0.0.1:7860
```
See `.env.example` for the full documented value.

---

## 🏗️ Infrastructure as Code (Terraform)

Terraform configurations in `terraform/` for provisioning the backend as a free-tier web service.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform plan && terraform apply
```

---

## 🔄 CI/CD Pipelines (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | PR / push to `main` | Python lint + pytest; marketing site build; revu-app frontend build |
| `cd.yml` | Push to `main` | Build Docker image → push to GHCR → trigger Render deploy hook |
| `release-app.yml` | Push `v*` tag | Cross-platform Tauri builds → GitHub Release with platform installers |

---

## ☸️ Kubernetes Deployment

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service-ingress.yaml
```

---

## 📊 Observability

- **Prometheus**: `GET /metrics`
- **Grafana**: Auto-provisioned `REVU Operations` dashboard (p95 latency, LLM fallback rate, 5xx alerts)

---

## 📄 API & License

See [API.md](file:///c:/Users/saish/OneDrive/Documents/Pictures/code%20reviewer/API.md) for endpoint signatures.

*License*: MIT
