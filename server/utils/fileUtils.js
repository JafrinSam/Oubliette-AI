const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

/**
 * Securely stores an uploaded dataset file using its SHA-256 hash as the filename.
 * ✅ FIX (L1): Uses the actual file extension from the source path instead of hardcoding .csv
 *
 * @param {string} tempPath   - Absolute path to the temporary uploaded file
 * @param {string} [originalName] - Original filename (used to derive extension)
 * @returns {string} SHA-256 hash of the file content
 */
exports.secureStoreDataset = async (tempPath, originalName) => {
    const fileBuffer = await fs.readFile(tempPath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // ✅ Derive extension from original name, fallback to source path, default to .bin
    const ext = originalName
        ? path.extname(originalName).toLowerCase()
        : path.extname(tempPath).toLowerCase() || '.bin';

    const storageDir = path.resolve(process.cwd(), config.STORAGE_PATHS.DATASETS);
    const targetPath = path.join(storageDir, `${hash}${ext}`);

    await fs.ensureDir(storageDir);

    if (!await fs.pathExists(targetPath)) {
        await fs.move(tempPath, targetPath);
    } else {
        await fs.remove(tempPath); // Clean up duplicate
    }

    return hash;
};