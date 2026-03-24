// server/routes/api.js
// This router previously exposed a legacy /upload route (uploadController) that
// bypassed authentication and RBAC, and duplicated /jobs routes without JWT checks.
// Both have been removed as part of the security hardening patch.
// The upload functionality is now handled by /api/datasets/upload (with full auth + RBAC).
// The jobs endpoints are in /api/jobs (jobRoutes.js).

const express = require('express');
const router = express.Router();

// No routes remain here — this file is kept to avoid a missing-module error if
// other code imports it. It can be removed entirely once all callers are updated.

module.exports = router;