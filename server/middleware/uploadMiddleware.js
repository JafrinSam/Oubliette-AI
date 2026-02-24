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

// Broadened File Filter for AI Datasets
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

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${ext}. Please upload valid training data or a .zip archive.`), false);
    }
};

// Multer Instance configured for Multiple Files
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // Increased to 2GB Limit for Images/Audio datasets
        files: 5000 // Allow up to 5000 files in a single multi-file upload
    }
});

module.exports = upload;