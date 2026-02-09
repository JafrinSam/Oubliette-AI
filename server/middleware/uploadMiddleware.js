const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

// Ensure temp directory exists
const tempDir = path.resolve(process.cwd(), config.STORAGE_PATHS.UPLOADS || 'storage/temp');
fs.ensureDirSync(tempDir);

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        // Prevent file collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/x-csv', 'application/x-csv', 'text/comma-separated-values', 'text/x-comma-separated-values'];
    // Also check extension as a fallback
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || ext === '.csv') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
};

// Multer Instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB Limit for Datasets
    }
});

module.exports = upload;