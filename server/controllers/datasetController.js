// controllers/datasetController.js
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const readline = require('readline');
const prisma = require('../prisma');
const { calculateFileHash } = require('../utils/hashUtils');
const { compareDatasets } = require('../utils/csvDiff');
const config = require('../config');
const { minioClient, BUCKET_NAME } = require('../config/minio');

const serializeDataset = (d) => ({
    ...d,
    sizeBytes: d.sizeBytes.toString(),
    uploadedAt: d.uploadedAt.toISOString()
});

/**
 * 1. UPLOAD (Multi-File -> Zip -> MinIO -> Garbage Collection)
 */
exports.uploadDataset = async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded." });

    const { name, versionAction } = req.body;
    let datasetName = name || "Untitled Dataset";

    let tempPath;
    let finalOriginalName;
    let finalMimeType;
    let finalSizeBytes = 0;

    try {
        // --- A. PROCESS FILES (ZIP if multiple) ---
        if (files.length === 1) {
            tempPath = files[0].path;
            finalOriginalName = files[0].originalname;
            finalMimeType = files[0].mimetype;
            finalSizeBytes = files[0].size;
        } else {
            finalOriginalName = `${datasetName.replace(/\s+/g, '_')}_archive.zip`;
            finalMimeType = 'application/zip';
            const tempDir = path.resolve(process.cwd(), config.STORAGE_PATHS.UPLOADS || 'storage/temp');
            tempPath = path.join(tempDir, `multi-${Date.now()}.zip`);

            await new Promise((resolve, reject) => {
                const output = fs.createWriteStream(tempPath);
                const archive = archiver('zip', { zlib: { level: 5 } });
                output.on('close', () => { finalSizeBytes = archive.pointer(); resolve(); });
                archive.on('error', err => reject(err));
                archive.pipe(output);
                for (const file of files) archive.file(file.path, { name: file.originalname });
                archive.finalize();
            });

            for (const file of files) await fs.remove(file.path).catch(() => { }); // Cleanup raw files
        }

        // --- B. HASH & UPLOAD TO MINIO (CAS) ---
        const hash = await calculateFileHash(tempPath);
        const objectName = `datasets/${hash}${path.extname(finalOriginalName)}`; // Save as S3 Key

        try {
            // Check if file already exists in MinIO
            await minioClient.statObject(BUCKET_NAME, objectName);
            console.log(`[MinIO] ♻️ Deduped: Artifact already exists.`);
        } catch (err) {
            if (err.code === 'NotFound') {
                // Upload to MinIO
                console.log(`[MinIO] Uploading new artifact...`);
                await minioClient.fPutObject(BUCKET_NAME, objectName, tempPath, { 'Content-Type': finalMimeType });
                console.log(`[MinIO] ✅ Upload complete.`);
            } else throw err;
        }

        // --- C. VERSIONING & GARBAGE COLLECTION ---
        let newVersion = 1;

        if (versionAction === 'NEW_VERSION') {
            const maxVer = await prisma.dataset.aggregate({
                where: { name: datasetName },
                _max: { version: true }
            });
            if (maxVer._max.version) newVersion = maxVer._max.version + 1;

            // 🧹 GARBAGE COLLECTION: Keep only latest 3 versions
            const oldVersions = await prisma.dataset.findMany({
                where: { name: datasetName },
                orderBy: { version: 'asc' }
            });

            if (oldVersions.length >= 3) {
                const oldest = oldVersions[0];

                // 🛡️ SECURITY CHECK: Ensure this dataset isn't used by any training jobs
                const jobCount = await prisma.job.count({ where: { datasetId: oldest.id } });

                if (jobCount === 0) {
                    // 1. Delete DB Record
                    await prisma.dataset.delete({ where: { id: oldest.id } });

                    // 2. Safely remove from MinIO if no other dataset uses this hash
                    const hashCount = await prisma.dataset.count({ where: { hash: oldest.hash } });
                    if (hashCount === 0) {
                        await minioClient.removeObject(BUCKET_NAME, oldest.path);
                        console.log(`[MinIO] 🗑️ Garbage Collected old artifact: ${oldest.path}`);
                    }
                } else {
                    console.log(`[GC] 🛡️ Skipping deletion of Dataset v${oldest.version} (Linked to ${jobCount} Jobs)`);
                }
            }
        } else {
            const nameCheck = await prisma.dataset.findFirst({ where: { name: datasetName } });
            if (nameCheck) return res.status(409).json({ error: `Dataset exists. Use NEW_VERSION.` });
        }

        // --- D. SAVE TO DB ---
        const userId = req.user.id; // ✨ INTEGRATED: Extract uploader identity
        const newDataset = await prisma.dataset.create({
            data: {
                name: datasetName,
                version: newVersion,
                filename: finalOriginalName,
                hash: hash,
                path: objectName,
                sizeBytes: BigInt(finalSizeBytes),
                mimeType: finalMimeType,
                ownerId: userId // ✨ INTEGRATED: Cryptographically bind data to the uploader
            }
        });

        // Cleanup local temp file
        await fs.remove(tempPath);
        res.status(201).json({ success: true, dataset: serializeDataset(newDataset) });

    } catch (error) {
        console.error("Upload Error:", error);
        if (tempPath) await fs.remove(tempPath).catch(() => { });
        res.status(500).json({ error: "Failed to upload dataset" });
    }
};

/**
 * 2. PREVIEW / EXPLORE DATASET (Reads directly from MinIO)
 */
exports.exploreDataset = async (req, res) => {
    const { id } = req.params;
    let tempDownloadPath = null;

    try {
        const dataset = await prisma.dataset.findUnique({ where: { id } });
        if (!dataset) return res.status(404).json({ error: "Dataset not found" });

        // SCENARIO 1: Tabular Data (Stream directly from MinIO - Super Fast)
        if (dataset.mimeType.includes('csv') || dataset.filename.endsWith('.csv')) {
            const dataStream = await minioClient.getObject(BUCKET_NAME, dataset.path);
            const rl = readline.createInterface({ input: dataStream, crlfDelay: Infinity });

            const lines = [];
            let lineCount = 0;
            for await (const line of rl) {
                lines.push(line.split(','));
                lineCount++;
                if (lineCount >= 50) break; // Only send 50 rows to frontend
            }
            dataStream.destroy(); // Stop downloading the rest of the 5GB file
            return res.json({ type: 'tabular', preview: lines });
        }

        // SCENARIO 2: ZIP Archive (Must download to temp disk to read directory)
        if (dataset.mimeType === 'application/zip' || dataset.filename.endsWith('.zip')) {
            const tempDir = path.resolve(process.cwd(), config.STORAGE_PATHS.UPLOADS || 'storage/temp');
            tempDownloadPath = path.join(tempDir, `preview-${Date.now()}.zip`);

            // Download from MinIO to temp file
            await minioClient.fGetObject(BUCKET_NAME, dataset.path, tempDownloadPath);

            const zip = new AdmZip(tempDownloadPath);
            const zipEntries = zip.getEntries();

            const fileList = zipEntries.map(entry => ({
                name: entry.entryName,
                size: entry.header.size,
                isDirectory: entry.isDirectory
            })).slice(0, 500); // UI performance limit

            // Cleanup temp file
            await fs.remove(tempDownloadPath);
            return res.json({ type: 'archive', contents: fileList, totalFiles: zipEntries.length });
        }

        res.json({ type: 'unknown', message: "Preview not supported." });

    } catch (error) {
        console.error("Explore Error:", error);
        if (tempDownloadPath) await fs.remove(tempDownloadPath).catch(() => { });
        res.status(500).json({ error: "Failed to preview dataset." });
    }
};

/**
 * 3. DOWNLOAD (Stream from MinIO to Client)
 */
exports.downloadDataset = async (req, res) => {
    try {
        const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
        if (!dataset) return res.status(404).json({ error: "Dataset not found" });

        const stat = await minioClient.statObject(BUCKET_NAME, dataset.path);

        res.setHeader('Content-disposition', `attachment; filename="${dataset.filename}"`);
        res.setHeader('Content-type', dataset.mimeType);
        res.setHeader('Content-length', stat.size);

        const dataStream = await minioClient.getObject(BUCKET_NAME, dataset.path);
        dataStream.pipe(res);
    } catch (error) {
        console.error("Download Error:", error);
        res.status(500).json({ error: "Download failed" });
    }
};

/**
 * 4. DELETE (Remove from MinIO)
 */
exports.deleteDataset = async (req, res) => {
    const { id } = req.params;
    try {
        const dataset = await prisma.dataset.findUnique({ where: { id } });
        if (!dataset) return res.status(404).json({ error: "Dataset not found" });

        const activeJobs = await prisma.job.count({ where: { datasetId: id } });
        if (activeJobs > 0) return res.status(409).json({ error: "Dataset is in use." });

        const usageCount = await prisma.dataset.count({ where: { hash: dataset.hash } });
        if (usageCount <= 1) {
            await minioClient.removeObject(BUCKET_NAME, dataset.path);
            console.log(`[MinIO] 🗑️ Removed physical object: ${dataset.path}`);
        }

        await prisma.dataset.delete({ where: { id } });
        res.json({ success: true, message: "Dataset deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
};

exports.getAllDatasets = async (req, res) => {
    try {
        const { id: userId, role } = req.user;

        // ✨ INTEGRATED: Micro-segmentation visibility filter (NIST 800-207)
        // Admins and Auditors see all; Data Scientists see only their own.
        const queryFilter = (role === 'ML_ADMIN' || role === 'SECURITY_AUDITOR')
            ? {}
            : { ownerId: userId };

        const datasets = await prisma.dataset.findMany({
            where: queryFilter,
            orderBy: { uploadedAt: 'desc' },
            include: { owner: { select: { email: true } } }
        });
        res.json(datasets.map(serializeDataset));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch datasets" });
    }
};

exports.getDatasetById = async (req, res) => {
    try {
        const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
        if (!dataset) return res.status(404).json({ error: "Dataset not found" });
        res.json(serializeDataset(dataset));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch dataset" });
    }
};

exports.diffDatasets = async (req, res) => {
    const { id1, id2 } = req.query;
    try {
        const d1 = await prisma.dataset.findUnique({ where: { id: id1 } });
        const d2 = await prisma.dataset.findUnique({ where: { id: id2 } });
        if (!d1 || !d2) return res.status(404).json({ error: "One or both datasets not found" });

        // For now, only CSV diff is supported
        if (!d1.filename.endsWith('.csv') || !d2.filename.endsWith('.csv')) {
            return res.status(400).json({ error: "Only CSV diff is supported" });
        }

        const diff = await compareDatasets(d1.path, d2.path);
        res.json(diff);
    } catch (error) {
        res.status(500).json({ error: "Diff failed" });
    }
};