const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const prisma = require('../prisma');
const { trainingQueue } = require('../redis');
const { secureStoreDataset } = require('../utils/fileUtils');
const config = require('../config');

exports.uploadJobFiles = async (req, res) => {
    try {
        const files = req.files;
        if (!files.dataset || !files.script) {
            return res.status(400).json({ error: "Missing dataset or script file." });
        }

        // 1. Secure Dataset
        const datasetHash = await secureStoreDataset(files.dataset[0].path);

        // 2. Secure Script
        const jobId = crypto.randomUUID();
        const scriptDir = path.resolve(process.cwd(), config.STORAGE_PATHS.SCRIPTS);
        await fs.ensureDir(scriptDir);
        
        const scriptPath = path.join(scriptDir, `${jobId}.py`);
        await fs.move(files.script[0].path, scriptPath);

        // 3. Queue Logic
        const params = req.body.params ? JSON.parse(req.body.params) : {};
        
        // DB Entry
        await prisma.job.create({
            data: {
                id: jobId,
                datasetHash: datasetHash,
                userScript: scriptPath,
                status: 'QUEUED'
            }
        });

        // Redis Queue
        await trainingQueue.add('train-model', {
            jobId,
            datasetHash,
            userScriptPath: scriptPath,
            userParams: params,
            fileSizeMB: files.dataset[0].size / (1024 * 1024),
            userRole: 'student'
        });

        res.json({ 
            success: true, 
            message: "Job Queued Successfully", 
            jobId, 
            status: "QUEUED" 
        });

    } catch (error) {
        console.error("Upload Controller Error:", error);
        res.status(500).json({ error: "Failed to process upload." });
    }
};