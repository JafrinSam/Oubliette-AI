const express = require('express');
const router = express.Router();
const multer = require('multer');
const runtimeController = require('../controllers/runtimeController');
const path = require('path');
const fs = require('fs-extra');

// Ensure temp directory exists
const tempDir = path.resolve(process.cwd(), 'storage/temp');
fs.ensureDirSync(tempDir);

// Temp storage for large .tar files
// We need a large limit for Docker images (e.g., 20GB)
const upload = multer({
    dest: tempDir,
    limits: { fileSize: 20 * 1024 * 1024 * 1024 }
});

// Routes
router.get('/', runtimeController.listRuntimes);
router.get('/scan', runtimeController.scanForNewImages);
router.post('/register', runtimeController.registerDetectedImages);
router.post('/upload', upload.single('image'), runtimeController.ingestImage);
router.delete('/:id', runtimeController.deleteRuntime);

module.exports = router;
