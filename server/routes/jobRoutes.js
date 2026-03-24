const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/authMiddleware');

// All job routes require a valid JWT
router.use(authenticate);

// Routes
router.get('/', jobController.listJobs);
router.post('/', jobController.createJob);
router.get('/:id', jobController.getJob);
router.get('/:id/logs', jobController.getJobLogs);
router.post('/:id/stop', jobController.stopJob);
router.post('/:id/restart', jobController.restartJob);

module.exports = router;

