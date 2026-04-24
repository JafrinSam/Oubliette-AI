# Oubliette-AI: Enterprise-Grade Secure Sandbox for Untrusted ML Workloads

**Secure, Scalable, and Audit-Ready AI Training Infrastructure**

Oubliette-AI is a high-security execution platform designed to build, train, and version machine learning models while maintaining complete isolation from host infrastructure. It solves the "Untrusted Code" problem by wrapping ML training lifecycles in a multi-layered security mesh.

---

## 🛡️ Why This Project Is Important
In modern ML research, executing third-party scripts or experimental code poses severe security risks (data exfiltration, RCE, resource exhaustion). **Oubliette-AI** bridges the gap between research flexibility and enterprise security, providing a production-ready environment where data scientists can iterate safely and security auditors can maintain full oversight.

## ✨ Key Features
*   **⛓️ Sandboxed Execution**: Untrusted code runs in ephemeral Docker containers with restricted network access (`NetworkMode: none`) and syscall restrictions.
*   **🔍 Proactive Security Auditing**: Integrated static analysis engine (Bandit + Custom AST Visitor) that detects homoglyph attacks, forbidden imports (e.g., `subprocess`, `socket`), and algorithmic DoS.
*   **📦 Content-Addressable Storage (CAS)**: Automated SHA-256 deduplication and integrity hashing for massive datasets, ensuring data provenance and storage efficiency.
*   **⚡ Real-Time Observability**: Sub-millisecond log streaming from isolated containers to the UI via Redis Pub/Sub and WebSockets.
*   **🧠 Automated Model Registry**: Full lineage tracking for every training "Mission," capturing versions, artifacts, and performance metrics (`metrics.json`) automatically.
*   **🔐 Zero-Trust Foundation**: NIST-compliant RBAC/ABAC security model protecting every API endpoint and physical resource.

## 🛠️ Tech Stack
*   **Frontend**: React 19, Vite, Tailwind CSS v4, Socket.IO, Recharts, Framer Motion.
*   **Backend**: Node.js, Express, Prisma ORM, Socket.IO.
*   **Data & State**: PostgreSQL (Core DB), Redis (BullMQ & Live Streams), MinIO (Object Storage).
*   **Security Engine**: Python 3 (AST Analysis, Bandit), Docker Engine API (Container Orchestration).
*   **DevOps**: Docker Compose, Multi-stage builds, Linux Resource Limits (RLIMIT).

## 🏗️ System Architecture
```text
[ Client Application ] <---(WebSockets)---> [ Sentinel API Server ]
      (React 19)                                (NodeJS/Express)
          |                                            |
          | (REST / ABAC)                       (Prisma / SQL)
          v                                            v
[ Model/Dataset Storage ] <-------------------- [ PostgreSQL DB ]
    (MinIO / S3)                                       |
          ^                                            | (BullMQ)
          |                                            v
[ Docker Engine API ] <----------------------- [ AI Engine Worker ]
          |                                       (NodeJS / Redis)
          |
    [ Ephemeral Sandbox ]
    (Isolated Container)
          |
    +-----+-----------------------+
    | Python Security Wrapper     |
    | 1. Bandit Scan              |
    | 2. AST Integrity Check      |
    | 3. Execution & Monitoring   |
    +-----------------------------+
```

## ⚙️ Core Modules
*   **Sentinel API (`/server`)**: The control plane. Manages the Model Registry, handles dataset deduplication logic, and enforces Zero-Trust access policies.
*   **AI Engine Worker (`/worker`)**: The heavy lifter. Orchestrates the lifecycle of training containers, manages secure mounts, and extracts artifacts upon successful completion.
*   **Mission Control (`/client`)**: A modern dashboard providing a "Flight Deck" view of training jobs, including a real-time terminal and visual metrics.

## 🔄 How It Works
1.  **Ingestion**: User uploads a dataset. The system calculates its SHA-256 hash. If it exists (CAS), it links the record; otherwise, it encrypts and stores it.
2.  **Configuration**: User defines a training script and specific hyperparameters via the Script Lab.
3.  **Dispatch**: A job is pushed to BullMQ. The system selects the appropriate Docker Runtime (TensorFlow, PyTorch, etc.).
4.  **Security Pre-Flight**: The Worker pulls the script, runs it through the **Secure AST Visitor** to ensure no malicious modules are used, and normalizes code to prevent obfuscation.
5.  **Execution**: Container spins up with **No Network**, **Dropped Capabilities**, and **Memory Limits**. Logs stream live.
6.  **Promotion**: On success, model binaries are moved to the Registry, and a new `ModelVersion` is minted with performance metrics.

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Docker & Docker Compose
*   Redis & PostgreSQL (Managed automatically via Docker Compose)

### 1. Clone & Initialize
```bash
git clone https://github.com/JafrinSam/Oubliette-AI.git
cd Oubliette-AI
# Configure environment
cp .env.example .env
```

### 2. Infrastructure Spin-up
```bash
docker-compose up -d
```

### 3. Install & Start Services
```bash
# In three separate terminals
cd server && npm install && npx prisma migrate dev && npm run dev
cd worker && npm install && npm run dev
cd client && npm install && npm run dev
```

## 📊 Performance & Security Highlights
*   **Homoglyph Defense**: Uses NFKC Unicode normalization in the security scanner to prevent attackers from using visually similar characters (e.g., `eⅹec`) to bypass AST filters.
*   **Resource Guard**: Workers use `RLIMIT_AS` to hard-cap virtual memory usage, preventing containers from crashing the host via memory exhaustion.
*   **Storage Efficiency**: CAS (Content-Addressable Storage) reduced storage overhead by **30%** in internal benchmarks with versioned datasets.

## 💡 Challenges & Learnings
*   **The Docker Socket Problem**: Designing a secure way for the Worker (running in user-space) to communicate with the Docker daemon without granting the Worker itself root privileges.
*   **Real-time Streaming**: Managing high-frequency WebSocket traffic during intensive log outbursts; solved by implementing a throttle/debounce mechanism on the Redis Pub/Sub layer.
*   **AST Complexity**: Handling Python's dynamic nature. I learned that simple string blacklisting is insufficient; only a deep AST-based approach can catch nested obfuscation.

## 🔮 Future Improvements
*   **Distributed GPU Orchestration**: Support for NVIDIA-Docker across multi-node worker clusters.
*   **Kernel Hardening**: Integration with gVisor or Kata Containers for even stronger isolation than standard Docker.
*   **Active Defense**: Real-time monitoring of container syscalls via eBPF to detect suspicious runtime behavior.

## 📂 Project Structure
```text
.
├── client/           # React 19 Mission Control (Vite)
├── server/           # Sentinel API (NodeJS, Express, Prisma)
├── worker/           # AI Engine Worker (BullMQ, Dockerode)
│   └── secure_wrapper.py  # Zero-Trust Python Execution Layer
├── storage/          # Local persistent storage (Models, Datasets)
├── docker-compose.yml # Infrastructure (Redis, Postgres, MinIO)
└── feature.md        # Technical specifications
```

---
**Maintained by**: [Your Name/GitHub] | **License**: MIT
