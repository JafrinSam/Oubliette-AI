const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Routes
router.get('/', jobController.listJobs);
router.post('/', jobController.createJob);
router.get('/:id', jobController.getJob);
router.get('/:id/logs', jobController.getJobLogs);
router.post('/:id/stop', jobController.stopJob);
router.post('/:id/restart', jobController.restartJob);

module.exports = router;
