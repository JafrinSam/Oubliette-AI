const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');

router.get('/', modelController.listModels);
router.get('/:id', modelController.getModel);

// Version Artifacts
router.get('/versions/:versionId/artifacts', modelController.listArtifacts);
router.get('/versions/:versionId/export', modelController.exportModelVersion);

// Model Management
router.delete('/:id', modelController.deleteModel); // Soft Delete
router.delete('/:id/hard', modelController.hardDeleteModel); // Hard Delete
router.post('/:id/restore', modelController.restoreModel); // Restore

module.exports = router;
