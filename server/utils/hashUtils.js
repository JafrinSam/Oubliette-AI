const fs = require('fs-extra');
const crypto = require('crypto');

/**
 * Calculates SHA-256 hash of a file using streams.
 * @param {string} filePath - Absolute path to the file.
 * @returns {Promise<string>} - Hex string of the hash.
 */
exports.calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('error', (err) => reject(err));
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
};
