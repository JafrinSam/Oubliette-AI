const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const { authenticate } = require('../middleware/authMiddleware');

// All model routes require a valid JWT
router.use(authenticate);

router.get('/', modelController.listModels);
router.get('/:id', modelController.getModel);
router.patch('/:id/access', modelController.updateAccess);

// Version Artifacts
router.get('/versions/:versionId/artifacts', modelController.listArtifacts);
router.get('/versions/:versionId/export', modelController.exportModelVersion);

// Model Management
router.delete('/:id', modelController.deleteModel);
router.delete('/:id/hard', modelController.hardDeleteModel);
router.post('/:id/restore', modelController.restoreModel);

module.exports = router;

