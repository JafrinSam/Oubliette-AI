# Mission Control Dashboard

**Oubliette-AI Mission Control** is a modern, high-performance web interface built to monitor and manage secure ML execution lifecycles.

## ✨ Features
*   **Mission Wizard**: A multi-step configuration interface for scripts, datasets, and hyperparameters.
*   **Live Terminal**: Real-time ANSI-supported log streaming powered by Socket.IO.
*   **Audit Viewer**: Deep-dive into job security scores, metrics, and forensic logs.
*   **Resource Center**: Versioned dataset management and model binary registry interface.
*   **Responsive Management**: Tailwind CSS v4 design system with full support for mobile monitoring.

## 🛠️ Tech Stack
*   **Framework**: React 19
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS v4
*   **Real-time**: Socket.IO Client
*   **State & Logic**: React Hooks & Context API
*   **Visualization**: Recharts (Metric trends)
*   **Animations**: Framer Motion

## ⚙️ Development

### Prerequisites
Ensure the **Sentinel API Server** is running before starting the dashboard.

### Commands
```bash
npm install
npm run dev
```

## 🏗️ Folder Structure
- `src/components`: Reusable UI components (Modals, Terminals, Cards).
- `src/pages`: Main application views (Dashboard, Jobs, Datasets, Registry).
- `src/lib`: API clients, WebSocket listeners, and utility functions.
- `src/hooks`: Custom hooks for real-time data fetching.

---
Part of the **Oubliette-AI** Ecosystem.
