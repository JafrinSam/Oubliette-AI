const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');
const scriptUpload = require('../middleware/scriptUpload');
const { authenticate } = require('../middleware/authMiddleware');

// All script routes require a valid JWT
router.use(authenticate);

// Routes
router.post('/', scriptUpload.single('script'), scriptController.uploadScript);
router.get('/', scriptController.listScripts);
router.get('/:scriptId/content', scriptController.getScriptContent);
router.delete('/:scriptId', scriptController.deleteScript);

module.exports = router;

