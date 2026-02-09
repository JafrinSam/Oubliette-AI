# Oubliette-AI

/sentinel-zero                <-- ROOT FOLDER
│
├── .gitignore                <-- node_modules, .env, storage/
├── .env                      <-- REDIS_HOST=localhost, PORT=3000
├── README.md                 <-- Project Documentation
├── INSTRUCTION.md            <-- The guide I gave you earlier
├── docker-compose.yml        <-- Runs Redis (and optionally the app)
│
├── /client                   <-- FRONTEND (React + Vite)
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js    <-- Sentinel Theme Colors go here
│   ├── vite.config.js
│   │
│   └── /src
│       ├── main.jsx
│       ├── App.jsx           <-- Routing Logic
│       ├── index.css         <-- Tailwind Imports
│       │
│       ├── /assets           <-- Logo.png goes here
│       │
│       ├── /components       <-- Reusable UI
│       │   ├── Navbar.jsx
│       │   ├── FileUpload.jsx
│       │   ├── TerminalLog.jsx
│       │   └── ModelCard.jsx
│       │
│       └── /pages            <-- Main Screens
│           ├── Dashboard.jsx
│           ├── Training.jsx
│           └── Settings.jsx
│
├── /server                   <-- BACKEND (Node.js)
│   ├── package.json
│   ├── index.js              <-- Entry Point (Express + Socket.io)
│   │
│   ├── /controllers          <-- API Logic
│   │   ├── authController.js
│   │   ├── datasetController.js
│   │   └── trainController.js
│   │
│   ├── /queue                <-- BullMQ Logic
│   │   ├── queue.js          <-- Setup Redis Connection
│   │   └── worker.js         <-- *CRITICAL* (Docker Controller)
│   │
│   ├── /routes               <-- API Endpoints
│   │   ├── api.js
│   │
│   └── /utils                <-- Helpers
│       ├── hasher.js         <-- SHA-256 Logic
│       └── validator.js      <-- Input Sanitization
│
├── /worker                   <-- AI ENGINE (Docker Context)
│   ├── Dockerfile            <-- The Secure Image Config
│   ├── requirements.txt      <-- tensorflow, bandit, pandas...
│   ├── secure_wrapper.py     <-- *CRITICAL* (The Guardian Script)
│   └── .dockerignore         <-- Prevent .env leaking into image
│
└── /storage                  <-- THE DATA VAULT (GitIgnore this!)
    ├── db.json               <-- LowDB Database File
    │
    ├── /datasets             <-- Raw Files
    │   ├── a1b2c3d4.csv      <-- Hashed Filenames
    │   └── e5f6g7h8.csv
    │
    └── /models               <-- Trained Artifacts
        └── /job-101
            ├── model.safetensors
            └── manifest.json