const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controllers
const uploadController = require('../controllers/uploadController');
const jobController = require('../controllers/jobController');

// Middleware
const upload = multer({ dest: 'uploads/' });

// -- ROUTES --

// Upload
router.post('/upload',
    upload.fields([{ name: 'dataset' }, { name: 'script' }]),
    uploadController.uploadJobFiles
);

// Job Status
router.get('/jobs/:id', jobController.getJob);

// Job Logs
router.get('/jobs/:id/logs', jobController.getJobLogs);

module.exports = router;