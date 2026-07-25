// server/controllers/uploadController.js
// ✅ REMOVED (H5 / M6): This legacy controller was deleted as part of the security patch.
// It hardcoded userRole: 'student' (bypassing RBAC), skipped authentication middleware,
// and passed raw user-supplied params directly to the Redis queue without validation.
//
// Dataset uploads are now handled by:
//   POST /api/datasets/upload  (with JWT authentication + file-type magic-byte validation)
// Job creation is handled by:
//   POST /api/jobs             (with JWT authentication + ownership checks)
//
// This file is left as an empty stub to avoid import errors in case any external
// tooling references it. It can be safely deleted once confirmed unused.

module.exports = {};