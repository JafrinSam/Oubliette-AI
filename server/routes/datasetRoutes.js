const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const { upload, validateMagicBytes } = require('../middleware/uploadMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

// All dataset routes require a valid JWT
router.use(authenticate);

// CRUD Routes
// ✅ FIX (H4): validateMagicBytes runs after multer saves the file to disk
router.post('/upload', upload.array('files', 5000), validateMagicBytes, datasetController.uploadDataset);
router.get('/diff', datasetController.diffDatasets);
router.get('/:id/explore', datasetController.exploreDataset);
router.patch('/:id/access', datasetController.updateAccess);
router.get('/', datasetController.getAllDatasets);
router.get('/:id', datasetController.getDatasetById);
router.get('/:id/download', datasetController.downloadDataset);
router.delete('/:id', datasetController.deleteDataset);

module.exports = router;

