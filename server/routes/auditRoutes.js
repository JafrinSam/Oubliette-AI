const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Only Security Auditors can read logs
router.get('/', authenticate, requireRole('SECURITY_AUDITOR'), auditController.getLogs);

module.exports = router;
