# AI Engine Worker

The **AI Engine Worker** is the execution layer of Oubliette-AI. It is responsible for spinning up secure, isolated environments to run untrusted Python code.

## 🛡️ The Oubliette Security Model
The worker utilizes a "Russian Doll" approach to security:

### 1. Docker Sandboxing
*   **Network Isolation**: `NetworkMode: 'none'` ensures that the running code cannot exfiltrate data or reach out to internal services.
*   **Capability Stripping**: Containers run with `CapDrop: ['ALL']` and as a non-root user (`User: "1000"`).
*   **ReadOnly Mounts**: The training script and source datasets are mounted as Read-Only (`:ro`) to prevent the container from tampering with the source.

### 2. Static Analysis Pre-Flight
Before a script touches the container, it passes through `secure_wrapper.py`:
*   **Bandit Scanner**: Checks for common security vulnerabilities (e.g., hardcoded credentials, insecure hashes).
*   **AST Integrity**: A custom `ast.NodeVisitor` blocks forbidden calls (`eval`, `exec`), blocked modules (`subprocess`, `socket`), and complexity-based DoS attacks.
*   **Homoglyph Sanitization**: Uses Unicode NFKC normalization to detect visually deceptive code.

### 3. Resource Constraints
*   **Memory Hard-Cap**: Enforced via `RLIMIT_AS` (default 16GB).
*   **Timeouts**: Execution is automatically terminated if it exceeds the mission's `max_seconds`.

## 📦 Job Lifecycle
1.  **Ingestion**: Downloads the dataset from secure storage (MinIO).
2.  **Decryption**: Decrypts the training script into a secure worker-local buffer.
3.  **Spin-up**: Creates and starts an ephemeral Docker container using `dockerode`.
4.  **Monitoring**: Monitors stdout/stderr and streams it to the Redis gateway.
5.  **Artifact Extraction**: On success, captures `metrics.json` and resulting binaries for promotion to the Model Registry.

## 🛠️ Tech Stack
*   **Node.js**: Worker lifecycle and queue management.
*   **Dockerode**: Direct interface with the Docker Engine API.
*   **Python**: Security auditing and execution supervisor.
*   **BullMQ**: High-performance job queue processing.

## ⚙️ Development
```bash
npm install
npm run dev
```
