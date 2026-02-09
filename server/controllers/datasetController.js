const path = require('path');
const fs = require('fs-extra');
const prisma = require('../prisma');
const { calculateFileHash } = require('../utils/hashUtils');
const { compareDatasets } = require('../utils/csvDiff');
const config = require('../config');

// Helper to handle BigInt for JSON
const serializeDataset = (d) => ({
    ...d,
    sizeBytes: d.sizeBytes.toString(),
    uploadedAt: d.uploadedAt.toISOString()
});

/**
 * 1. UPLOAD with VERSIONING (Fixed Integrity Logic + DEBUGGING)
 */
exports.uploadDataset = async (req, res) => {
    const file = req.file;
    if (!file) {
        console.error("[DEBUG] Upload failed: No file in request");
        return res.status(400).json({ error: "No file uploaded." });
    }

    const { name, versionAction } = req.body;
    const tempPath = file.path;

    console.log(`[DEBUG] 🚀 Upload Started: ${file.originalname} (${file.size} bytes)`);
    console.log(`[DEBUG] Temp Path: ${tempPath}`);
    console.log(`[DEBUG] Action: ${versionAction}, Name: ${name}`);

    try {
        // A. Calculate Hash
        const hash = await calculateFileHash(tempPath);
        console.log(`[DEBUG] calculated Hash: ${hash}`);

        // B. Define Target Location
        const storageDir = path.resolve(process.cwd(), config.STORAGE_PATHS.DATASETS || 'storage/datasets');
        await fs.ensureDir(storageDir);

        // Use hash + original extension for storage filename
        const targetPath = path.join(storageDir, `${hash}${path.extname(file.originalname)}`);
        console.log(`[DEBUG] Target Storage Path: ${targetPath}`);

        // 🛑 CRITICAL FIX: Check the DISK, not the DB
        const fileExistsOnDisk = await fs.pathExists(targetPath);
        console.log(`[DEBUG] File exists on disk? ${fileExistsOnDisk}`);

        if (!fileExistsOnDisk) {
            // File is missing from disk (new or lost). Move the temp file there.
            await fs.move(tempPath, targetPath, { overwrite: true });
            console.log(`[Upload] ✅ Saved new file to disk.`);
        } else {
            // File exists on disk. Safe to delete temp.
            await fs.remove(tempPath);
            console.log(`[Upload] ♻️ Deduped: File already exists on disk. Temp removed.`);
        }

        // C. Determine Version
        let datasetName = name || "Untitled Dataset";
        let newVersion = 1;

        if (versionAction === 'NEW_VERSION') {
            const maxVer = await prisma.dataset.aggregate({
                where: { name: datasetName },
                _max: { version: true }
            });
            if (maxVer._max.version) {
                newVersion = maxVer._max.version + 1;
            }
            console.log(`[DEBUG] Versioning: Incrementing to v${newVersion}`);
        } else {
            const nameCheck = await prisma.dataset.findFirst({ where: { name: datasetName } });
            if (nameCheck) {
                console.warn(`[DEBUG] Conflict: Dataset '${datasetName}' already exists.`);
                return res.status(409).json({
                    error: `Dataset '${datasetName}' already exists. Use 'NEW_VERSION' or choose a different name.`
                });
            }
            console.log(`[DEBUG] Versioning: Creating new v1 dataset`);
        }

        // D. Create DB Record
        const newDataset = await prisma.dataset.create({
            data: {
                name: datasetName,
                version: newVersion,
                filename: file.originalname,
                hash: hash,
                path: targetPath, // Points to the robustly saved file
                sizeBytes: BigInt(file.size),
                mimeType: file.mimetype
            }
        });

        console.log(`[DEBUG] ✅ Database record created: ID ${newDataset.id}`);

        res.status(201).json({
            success: true,
            message: "Dataset uploaded successfully",
            dataset: serializeDataset(newDataset)
        });

    } catch (error) {
        console.error(`[Upload] ❌ Error: ${error.message}`);
        console.error(error.stack);
        // Ensure temp cleanup on failure
        if (await fs.pathExists(tempPath)) await fs.remove(tempPath);
        res.status(500).json({ error: "Failed to upload dataset" });
    }
};

/**
 * 2. GET DIFF
 */
exports.diffDatasets = async (req, res) => {
    try {
        const { idA, idB } = req.query;
        console.log(`[DEBUG] Diff requested between ID: ${idA} and ID: ${idB}`);

        const [datasetA, datasetB] = await Promise.all([
            prisma.dataset.findUnique({ where: { id: idA } }),
            prisma.dataset.findUnique({ where: { id: idB } })
        ]);

        if (!datasetA || !datasetB) {
            console.warn(`[DEBUG] One or both datasets not found in DB.`);
            return res.status(404).json({ error: "Datasets not found" });
        }

        console.log(`[DEBUG] Path A: ${datasetA.path}`);
        console.log(`[DEBUG] Path B: ${datasetB.path}`);

        // Ensure files exist before diffing
        if (!await fs.pathExists(datasetA.path) || !await fs.pathExists(datasetB.path)) {
            console.error(`[DEBUG] Integrity Error: Files missing from disk during diff.`);
            return res.status(500).json({ error: "One or both dataset files are missing from disk." });
        }

        const diffReport = await compareDatasets(datasetA.path, datasetB.path);

        res.json({
            datasetA: { name: datasetA.name, version: datasetA.version },
            datasetB: { name: datasetB.name, version: datasetB.version },
            diff: diffReport
        });
    } catch (error) {
        console.error("Diff Error:", error);
        res.status(500).json({ error: "Failed to calculate diff" });
    }
};

/**
 * 3. GET ALL DATASETS
 */
exports.getAllDatasets = async (req, res) => {
    try {
        const datasets = await prisma.dataset.findMany({ orderBy: { uploadedAt: 'desc' } });
        console.log(`[DEBUG] Fetched ${datasets.length} datasets.`);
        res.json(datasets.map(serializeDataset));
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch datasets" });
    }
};

/**
 * 4. GET BY ID
 */
exports.getDatasetById = async (req, res) => {
    try {
        const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
        if (!dataset) return res.status(404).json({ error: "Dataset not found" });
        res.json(serializeDataset(dataset));
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

/**
 * 5. DOWNLOAD
 */
exports.downloadDataset = async (req, res) => {
    try {
        console.log(`[DEBUG] Download requested for ID: ${req.params.id}`);
        const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });

        if (!dataset) {
            console.warn(`[DEBUG] Dataset ID not found in DB`);
            return res.status(404).json({ error: "Dataset not found" });
        }

        console.log(`[DEBUG] Resolving file path: ${dataset.path}`);
        if (!await fs.pathExists(dataset.path)) {
            console.error(`[DEBUG] ❌ CRITICAL: File missing from disk at ${dataset.path}`);
            return res.status(500).json({ error: "File missing from disk (Integrity Error)" });
        }
        res.download(dataset.path, dataset.filename);
    } catch (error) {
        console.error(`[DEBUG] Download Error:`, error);
        res.status(500).json({ error: "Download failed" });
    }
};

/**
 * 6. DELETE
 */
exports.deleteDataset = async (req, res) => {
    const { id } = req.params;
    console.log(`[DEBUG] Delete requested for ID: ${id}`);

    try {
        const dataset = await prisma.dataset.findUnique({ where: { id } });
        if (!dataset) return res.status(404).json({ error: "Dataset not found" });

        // Check for active usage by jobs
        const activeJobs = await prisma.job.count({ where: { datasetId: id } });
        if (activeJobs > 0) {
            return res.status(409).json({ error: `Cannot delete dataset. It is used by ${activeJobs} job(s).` });
        }

        // Logic: Only delete file if NO OTHER dataset uses it (Deduplication check)
        const usageCount = await prisma.dataset.count({ where: { hash: dataset.hash } });
        console.log(`[DEBUG] Hash ${dataset.hash} is used by ${usageCount} records.`);

        if (usageCount <= 1) {
            // This is the last record using this file. Safe to delete from disk.
            if (await fs.pathExists(dataset.path)) {
                await fs.remove(dataset.path);
                console.log(`[Delete] 🗑️ Removed physical file: ${dataset.path}`);
            } else {
                console.warn(`[Delete] File was already missing from disk.`);
            }
        } else {
            console.log(`[Delete] 🔒 Skipped file deletion (Hash used by ${usageCount - 1} other versions).`);
        }

        await prisma.dataset.delete({ where: { id } });
        console.log(`[DEBUG] DB Record deleted.`);
        res.json({ success: true, message: "Dataset deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete dataset" });
    }
};