const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const upload = require('../middleware/uploadMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

// All dataset routes require a valid JWT
router.use(authenticate);

// CRUD Routes
router.post('/upload', upload.array('files', 5000), datasetController.uploadDataset);
router.get('/diff', datasetController.diffDatasets);
router.get('/:id/explore', datasetController.exploreDataset);
router.get('/', datasetController.getAllDatasets);
router.get('/:id', datasetController.getDatasetById);
router.get('/:id/download', datasetController.downloadDataset);
router.delete('/:id', datasetController.deleteDataset);

module.exports = router;

