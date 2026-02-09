const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

exports.secureStoreDataset = async (tempPath) => {
    const fileBuffer = await fs.readFile(tempPath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    const storageDir = path.resolve(process.cwd(), config.STORAGE_PATHS.DATASETS);
    const targetPath = path.join(storageDir, `${hash}.csv`);

    await fs.ensureDir(storageDir);
    
    if (!await fs.pathExists(targetPath)) {
        await fs.move(tempPath, targetPath);
    } else {
        await fs.remove(tempPath); // Clean up duplicate
    }
    
    return hash;
};