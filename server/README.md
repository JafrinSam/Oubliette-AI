# Sentinel API Server

The **Sentinel API** is the central control plane for Oubliette-AI. It manages identity, resource orchestration, and the Model Registry.

## 🔒 Security Architecture: Zero-Trust RBAC & ABAC
The server implements a strict **NIST 800-207 compliant** security model:
*   **Identity (RBAC)**: Users are assigned roles (`ML_ADMIN`, `DATA_SCIENTIST`, `SECURITY_AUDITOR`).
*   **Resource Access (ABAC)**: Access to Datasets, Scripts, and Models is governed by fine-grained attributes:
    *   `ClearanceLevel`: (Unclassified, Internal, Restricted, Top Secret)
    *   `Department`: Ensures multi-tenant isolation within a single organization.
    *   `Sensitivity`: Automated tagging of resources based on audit results.

## 🚀 Key Responsibilities
*   **Dataset Management**: Implements Content-Addressable Storage (CAS) for deduplication.
*   **Job Orchestration**: Dispatches training missions via **BullMQ** (Redis-backed).
*   **Model Registry**: Manages model versioning, artifacts (binaries), and security audit metadata.
*   **Real-time Gateway**: Handles WebSocket connections for live log streaming.

## 🛠️ Tech Stack
*   **Runtime**: Node.js v18+
*   **Framework**: Express.js
*   **ORM**: Prisma with PostgreSQL
*   **Queue**: BullMQ (Redis)
*   **Communication**: Socket.IO

## 📡 Primary Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/datasets` | `POST` | Upload dataset with SHA-256 deduplication |
| `/api/jobs` | `POST` | Dispatch a new training mission |
| `/api/models` | `GET` | List production-ready model versions |
| `/api/runtimes` | `GET` | Scan and sync Docker images from daemon |

## ⚙️ Development
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
