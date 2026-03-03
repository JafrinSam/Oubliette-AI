// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

// 1. Ensure temp directory exists (Safe Landing Zone)
// We use local disk temporarily to prevent RAM crashes (OOM) on large AI datasets.
const tempDir = path.resolve(process.cwd(), config.STORAGE_PATHS?.UPLOADS || 'storage/temp');
fs.ensureDirSync(tempDir);

// 2. Configure Local Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        // Prevent file collisions when uploading 1000s of files simultaneously
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || ''; // Fallback for no extension
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// 3. Broadened File Filter for AI Datasets
const fileFilter = (req, file, cb) => {
    // List of allowed extensions for training data
    const allowedExtensions = [
        '.csv', '.json', '.txt', '.parquet',             // Tabular / Text
        '.zip', '.tar', '.gz', '.tgz',                   // Archives
        '.jpg', '.jpeg', '.png', '.webp', '.bmp',        // Images
        '.wav', '.mp3', '.flac',                         // Audio
        '.mp4', '.avi'                                   // Video
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    // Reject files with no extension
    if (!ext) {
        return cb(new Error(`File "${file.originalname}" has no extension. Please upload valid training data.`), false);
    }

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${ext}. Please upload valid training data or a .zip archive.`), false);
    }
};

// 4. Multer Instance configured for Heavy MLOps Workloads
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB Limit per file (for large 4K images/video)
        files: 5000 // Allow up to 5000 files in a single multi-file upload
    }
});

module.exports = upload;