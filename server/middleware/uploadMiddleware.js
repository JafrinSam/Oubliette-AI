// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const fileType = require('file-type');
const config = require('../config');

// 1. Ensure temp directory exists
const tempDir = path.resolve(process.cwd(), config.STORAGE_PATHS?.UPLOADS || 'storage/temp');
fs.ensureDirSync(tempDir);

// 2. Configure Local Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '';
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// 3. Extension-level pre-filter (first gate — still needed for early rejection)
const ALLOWED_EXTENSIONS = new Set([
    '.csv', '.json', '.txt', '.parquet',
    '.zip', '.tar', '.gz', '.tgz',
    '.jpg', '.jpeg', '.png', '.webp', '.bmp',
    '.wav', '.mp3', '.flac',
    '.mp4', '.avi'
]);

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ext) {
        return cb(new Error(`File "${file.originalname}" has no extension. Please upload valid training data.`), false);
    }

    if (ALLOWED_EXTENSIONS.has(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${ext}. Please upload valid training data or a .zip archive.`), false);
    }
};

// 4. Multer Instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB
        files: 5000
    }
});

// ✅ FIX (H4): Magic-byte validation middleware
// Maps allowed MIME types detected from file content to their permitted extensions.
// Run this AFTER multer has written the file to disk.
const ALLOWED_MIME_TO_EXT = new Map([
    ['text/csv',                 ['.csv', '.txt']],
    ['application/json',         ['.json']],
    ['application/zip',          ['.zip', '.tgz']],
    ['application/x-tar',        ['.tar']],
    ['application/gzip',         ['.gz', '.tgz']],
    ['application/octet-stream', ['.parquet', '.arrow']],
    ['image/jpeg',               ['.jpg', '.jpeg']],
    ['image/png',                ['.png']],
    ['image/webp',               ['.webp']],
    ['image/bmp',                ['.bmp']],
    ['audio/wav',                ['.wav']],
    ['audio/mpeg',               ['.mp3']],
    ['audio/flac',               ['.flac', '.fla']],
    ['video/mp4',                ['.mp4']],
    ['video/x-msvideo',          ['.avi']],
]);

/**
 * Express middleware that checks magic bytes of every uploaded file.
 * Must be used AFTER multer (files must be on disk first).
 */
const validateMagicBytes = async (req, res, next) => {
    const files = req.files
        ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
        : (req.file ? [req.file] : []);

    for (const file of files) {
        try {
            // Read only the first 4,100 bytes (enough for all magic signatures)
            const fd = await fs.open(file.path, 'r');
            const buf = Buffer.alloc(4100);
            await fs.read(fd, buf, 0, 4100, 0);
            await fs.close(fd);

            const detected = await fileType.fromBuffer(buf);
            const declaredExt = path.extname(file.originalname).toLowerCase();

            if (detected) {
                const allowedExts = ALLOWED_MIME_TO_EXT.get(detected.mime) || [];
                if (!allowedExts.includes(declaredExt) && !allowedExts.includes('.' + detected.ext)) {
                    // Cleanup the bad file
                    await fs.remove(file.path).catch(() => {});
                    return res.status(400).json({
                        error: `File "${file.originalname}" failed magic-byte validation. Detected: ${detected.mime}, declared: ${declaredExt}.`
                    });
                }
            }
            // If file-type cannot detect a type (e.g., plain-text CSV, Parquet), we trust the extension filter above.
        } catch (err) {
            console.error('[UploadMiddleware] Magic-byte check error:', err);
            await fs.remove(file.path).catch(() => {});
            return res.status(400).json({ error: 'File validation failed.' });
        }
    }
    next();
};

module.exports = { upload, validateMagicBytes };