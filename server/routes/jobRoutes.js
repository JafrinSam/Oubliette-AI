const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Routes
router.get('/', jobController.getAllJobs);
router.post('/', jobController.createJob);
router.get('/:id', jobController.getJobStatus);
router.get('/:id/logs', jobController.getJobLogs);

module.exports = router;
