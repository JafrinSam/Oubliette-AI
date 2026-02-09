const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

// Ensure temp directory exists
const tempDir = path.resolve(process.cwd(), config.STORAGE_PATHS.UPLOADS || 'storage/temp');
fs.ensureDirSync(tempDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        // Prevent file collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'script-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // 🔒 Security: Allow ONLY Python files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.py') {
        cb(null, true);
    } else {
        cb(new Error('Security Block: Only .py files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit scripts to 5MB
    }
});

module.exports = upload;