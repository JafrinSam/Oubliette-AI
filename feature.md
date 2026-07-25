# Feature Specifications

## 🏗️ Architecture
- **Type**: Microservices Monorepo
- **Core**: Server (API/Control) + Worker (Execution/Sandbox)
- **Communication**: Redis (BullMQ for jobs, Pub/Sub for live logs)
- **Database**: PostgreSQL with Prisma ORM

## ✨ Features

### 1. Sentinel API Server (`/server`)
- **Dataset Management**: CAS deduplication, version control, and schema/row diffing.
- **Job Controller**: Manages training lifecycles (Create, Stop, Restart, Log Fetching).
- **Model Registry**: Handles version history, artifacts listing, and ZIP exports.
- **Security**: Request logging, sandboxed worker communication, and soft-delete protection.

### 2. AI Engine Worker (`/worker`)
- **Sandboxed Execution**: Executes untrusted code in isolated Docker containers via `dockerode`.
- **Runtime Manager**: Dynamic management of Docker images (Scan, Register, Ingest `.tar`).
- **Secure Wrapper**: A Python-based supervisor (`secure_wrapper.py`) that enforces security and extracts metrics.
- **Artifact Handling**: Automatic capture of `metrics.json` and model binaries on job completion.

### 3. Client Application (`/client`)
- **Mission Control**: Advanced job tracking with real-time log terminal and status indicators.
- **Script Lab**: Feature-rich Python editor powered by Monaco Editor.
- **Model Registry UI**: Comprehensive dashboard with Trash Bin, version history, and artifact downloads.
- **Job Wizard**: Intelligent 3-step workflow for configuring training missions.

## 🔌 API Endpoints

### 📊 Datasets
- `GET /api/datasets`: List all dataset versions.
- `POST /api/datasets/upload`: Upload CSV with SHA-256 deduplication.
- `GET /api/datasets/diff`: Compare versions (schema & row deltas).

### 🤖 Jobs
- `GET /api/jobs`: List missions with pagination.
- `POST /api/jobs`: Dispatch new training job to BullMQ.
- `GET /api/jobs/:id/logs`: Fetch full audit logs.
- `POST /api/jobs/:id/stop` / `restart`: Lifecycle control.

### 🧠 Models
- `GET /api/models`: List models (supports `?status=deleted` for trash).
- `GET /api/models/:id`: Detailed version history and metrics.
- `DELETE /api/models/:id`: Move to trash (Soft Delete).
- `GET /api/models/versions/:vId/export`: Download as ZIP.

### 🐳 Runtimes
- `GET /api/runtimes/scan`: Detect local Docker images.
- `POST /api/runtimes/register`: Add images to registry.
- `POST /api/runtimes/upload`: Ingest air-gapped environment packages.

## 📋 Security & Monitoring
- **Real-time Terminal**: WebSocket streaming of stderr/stdout from isolated containers.
- **Content-Addressable Storage**: Ensures data integrity and prevents duplicated storage.
- **Sandboxed Runtimes**: Network-restricted containers prevent data exfiltration.
