# Feature Specifications

## 🏗️ Architecture
- **Type**: Microservices Monorepo
- **Communication**: Redis (BullMQ for jobs, Pub/Sub for events)
- **Database**: PostgreSQL (Prisma ORM)

## ✨ Features

### 1. Sentinel API Server (`/server`)
- **Role**: Entry point for clients, authentication (TODO), and data management.
- **Tech**: Express.js, Socket.io, Prisma.
- **Key Modules**:
  - **Dataset Upload**: Secure, deduplicated upload using SHA-256 hashing.
  - **Data Version Control**: Tracks dataset evolution (v1 → v2) and computes diffs (schema/rows).
  - **Job Management**: Dispatching training jobs to the queue.

### 2. AI Engine Worker (`/worker`)
- **Role**: Asynchronous job processor.
- **Tech**: Node.js, BullMQ, Dockerode, Python.
- **Capabilities**:
  - **Sandboxed Execution**: Runs user scripts in isolated Docker containers.
  - **Secure Wrapper**: Python wrapper ensures script integrity.
  - **Resource Limits**: Enforces time and memory constraints.
  - **Runtime Manager**: Docker image management (Scan, Register, Ingest).

### 3. Shared Storage (`/storage`)
- **Structure**:
  - `datasets/`: Content-addressable storage for raw CSVs (renamed to Hash).
  - `scripts/`: User-submitted python scripts.
  - `models/`: Trained model binaries and logs.
  - `temp/`: Transient upload staging area.

### 4. Client Application (`/client`)
- **Role**: User Interface for managing datasets, scripts, and jobs.
- **Tech**: React 18, Vite, Tailwind CSS, Framer Motion.
- **Key Features**:
  - **Responsive Design**: Mobile-friendly layout with collapsible sidebar and adaptive editor.
  - **Script Lab**: Interactive Python editor with Monaco.
  - **Real-time Updates**: Live job status and terminal output.
  - **Design System**: "Sentinel" Dark Theme (Slate/Cyan/Emerald).
  - **Toast System**: Context-based notification system replacing native alerts.
  - **Job Creation Wizard**: Multi-step interface for launching training missions.
- **Responsive UI**:
  - Mobile-first approach with hamburger menu.
  - Adaptive layouts for ScriptLab and Sidebar.

## 🔌 API Endpoints

### Datasets
- `POST /api/datasets/upload`: Upload a CSV dataset.
  - **Body**: `multipart/form-data` (`file`)
  - **Response**: Dataset metadata (ID, Hash, Path).
  - **Logic**: Deduplicates files; if hash exists, returns existing record. Supports `versionAction: 'NEW_VERSION'`.
- `GET /api/datasets/diff`: Compare two dataset versions.
  - **Query**: `?idA=...&idB=...`
  - **Response**: Schema changes (added/removed columns) and row count delta.

### Runtimes
- `GET /api/runtimes/scan`: Detect unregistered Docker images.
- `POST /api/runtimes/register`: Add Docker image to database.
- `POST /api/runtimes/upload`: Ingest `.tar` file into Docker.
