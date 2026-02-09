const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');

router.get('/', modelController.listModels);
router.get('/:id', modelController.getModel);
router.get('/versions/:versionId/artifacts', modelController.listArtifacts);

module.exports = router;
