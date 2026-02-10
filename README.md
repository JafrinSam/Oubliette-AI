# Oubliette AI

**Oubliette AI** is a secure, containerized platform for executing untrusted AI/ML code. It provides a robust environment for managing datasets, scripts, and runtime environments, ensuring that model training and inference jobs run in complete isolation.

![Oubliette AI Banner](https://via.placeholder.com/1200x300?text=Oubliette+AI+Platform)

---

## 🚀 Key Features

- **🛡️ Secure Execution**: All user scripts are executed within isolated Docker containers with restricted network access, protecting your infrastructure from malicious code.
- **📦 Model Registry**: Built-in version control for ML models. Track lineage, versions, and artifacts automatically.
- **⚡ Real-time Monitoring**: Stream build logs and training metrics (loss, accuracy) in real-time via WebSockets.
- **🔧 Runtime Manager**: Define and manage custom Docker environments (e.g., TensorFlow, PyTorch, Scikit-learn) to match your workload needs.
- **📊 Dataset Versioning**: Automatic deduplication and integrity hashing (SHA-256) for all uploaded datasets.
- **🔄 Job Recovery**: Robust job queue system (BullMQ) with automatic retries, detailed audit logs, and job cloning/restarting capabilities.

---

## 🏗️ Architecture

The platform follows a microservices-inspired architecture comprising three main components:

### 1. Client (`/client`)
A modern, responsive dashboard built with **React** and **Vite**.
- **Tech Stack**: React 19, Tailwind CSS v4, Socket.IO Client, Recharts, Framer Motion.
- **Features**:
    - **Job Creation Wizard**: Step-by-step flow to configure scripts, datasets, and hyperparameters.
    - **Live Terminal**: ANSI-supported log streaming for active jobs.
    - **Resource Management**: UI for uploading datasets, managing scripts, and inspecting model artifacts.

### 2. Server (`/server`)
The central control plane managing API requests, database state, and real-time communication.
- **Tech Stack**: Node.js, Express, Prisma ORM, Socket.IO, Redis.
- **Features**:
    - **REST API**: Endpoints for all platform resources.
    - **WebSocket Gateway**: Pushes real-time status updates and logs to clients.
    - **Job Dispatcher**: Validates requests and pushes jobs to the Redis queue.

### 3. Worker (`/worker`)
The heavy lifter responsible for executing code securely.
- **Tech Stack**: Node.js, BullMQ, Dockerode, Python.
- **Features**:
    - **Sandboxed Execution**: Spawns ephemeral Docker containers for each job.
    - **Secure Wrapper**: A Python-based supervisor (`secure_wrapper.py`) that monitors the training process inside the container.
    - **Artifact Extraction**: Automatically captures and stores model outputs upon success.

---

## 🛠️ Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v18+)
- **Docker Desktop** (Engine v24+)
- **PostgreSQL** (v14+)
- **Redis** (v7+)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/JafrinSam/Oubliette-AI.git
cd Oubliette-AI
```

### 2. Configure Environment Variables
Create a root `.env` file (or use the provided example):
```ini
# .env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/oubliette_db"
REDIS_HOST="localhost"
REDIS_PORT=6379
```
*Note: Ensure you have corresponding `.env` files in `server` and `worker` if they require specific overrides, though they typically inherit or default to these.*

### 3. Install Dependencies
You need to install dependencies for all three modules:

```bash
# Client
cd client && npm install

# Server
cd ../server && npm install

# Worker
cd ../worker && npm install
```

### 4. Database Setup
Initialize the database schema using Prisma:

```bash
cd server
npx prisma migrate dev --name init
```

---

## ▶️ Running the Platform

To start the full stack, you will need three terminal instances:

**Terminal 1: Server**
```bash
cd server
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2: Worker**
```bash
cd worker
npm run dev
# Connects to Redis and waits for jobs
```

**Terminal 3: Client**
```bash
cd client
npm run dev
# Accessible at http://localhost:5173
```

---

## 📚 Documentation

- **[API Documentation](server/README.md)** (Coming Soon)
- **[Worker Security Model](worker/README.md)** (Coming Soon)

