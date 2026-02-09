const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
// Import your multer middleware config here
const upload = require('../middleware/uploadMiddleware');

// CRUD Routes
router.post('/upload', upload.single('dataset'), datasetController.uploadDataset);
router.get('/diff', datasetController.diffDatasets); // New Diff Route
router.get('/', datasetController.getAllDatasets);
router.get('/:id', datasetController.getDatasetById);
router.get('/:id/download', datasetController.downloadDataset);
router.delete('/:id', datasetController.deleteDataset);

module.exports = router;
