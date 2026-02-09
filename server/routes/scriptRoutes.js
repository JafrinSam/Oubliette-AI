const express = require('express');
const router = express.Router();
const multer = require('multer');
const scriptController = require('../controllers/scriptController');

const scriptUpload = require('../middleware/scriptUpload');

// Routes
router.post('/', scriptUpload.single('script'), scriptController.uploadScript);
router.get('/', scriptController.listScripts);
router.get('/:scriptId/content', scriptController.getScriptContent);
router.delete('/:scriptId', scriptController.deleteScript);

module.exports = router;
