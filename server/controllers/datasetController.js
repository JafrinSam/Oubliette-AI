const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver'); // Required for multi-file zipping
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
 * 1. UPLOAD (Supports Single File, Single ZIP, or Multiple Files)
 */
exports.uploadDataset = async (req, res) => {
    // NOTE: Your route must now use upload.array('files') instead of upload.single()
    const files = req.files;

    if (!files || files.length === 0) {
        console.error("[DEBUG] Upload failed: No files in request");
        return res.status(400).json({ error: "No files uploaded." });
    }

    const { name, versionAction } = req.body;
    let datasetName = name || "Untitled Dataset";

    let tempPath;
    let finalOriginalName;
    let finalMimeType;
    let finalSizeBytes = 0;

    console.log(`[DatasetController] 🚀 Upload Started: ${files.length} file(s) received.`);

    try {
        // ==========================================
        // A. FILE PROCESSING & ZIPPING LOGIC
        // ==========================================
        if (files.length === 1) {
            // SCENARIO 1: Single file uploaded (e.g., one .csv, or one pre-zipped .zip)
            console.log(`[DEBUG] Processing single file: ${files[0].originalname}`);
            tempPath = files[0].path;
            finalOriginalName = files[0].originalname;
            finalMimeType = files[0].mimetype;
            finalSizeBytes = files[0].size;
        } else {
            // SCENARIO 2: Multiple files uploaded (e.g., 50 .jpg images)
            // Solution: Zip them on the fly so we have a single artifact to hash and store
            console.log(`[DEBUG] Multi-file upload detected. Zipping ${files.length} files...`);

            finalOriginalName = `${datasetName.replace(/\s+/g, '_')}_archive.zip`;
            finalMimeType = 'application/zip';

            const tempDir = path.resolve(process.cwd(), config.STORAGE_PATHS.UPLOADS || 'storage/temp');
            tempPath = path.join(tempDir, `multi-${Date.now()}.zip`);

            // Create Zip stream
            await new Promise((resolve, reject) => {
                const output = fs.createWriteStream(tempPath);
                const archive = archiver('zip', { zlib: { level: 5 } }); // Medium compression for speed

                output.on('close', () => {
                    finalSizeBytes = archive.pointer();
                    console.log(`[DEBUG] Zipping complete. Size: ${finalSizeBytes} bytes`);
                    resolve();
                });

                archive.on('error', err => reject(err));
                archive.pipe(output);

                // Add all uploaded files to the zip
                for (const file of files) {
                    archive.file(file.path, { name: file.originalname });
                }
                archive.finalize();
            });

            // Cleanup: Delete the individual uploaded temp files since they are now in the zip
            for (const file of files) {
                await fs.remove(file.path).catch(e => console.warn(`Cleanup warn: ${e.message}`));
            }
        }

        // ==========================================
        // B. HASHING & DEDUPLICATION (Content-Addressable Storage)
        // ==========================================
        console.log(`[DEBUG] Calculating SHA-256 Hash...`);
        const hash = await calculateFileHash(tempPath);
        console.log(`[DEBUG] Hash: ${hash}`);

        const storageDir = path.resolve(process.cwd(), config.STORAGE_PATHS.DATASETS || 'storage/datasets');
        await fs.ensureDir(storageDir);

        // Final resting place (named by hash)
        const targetPath = path.join(storageDir, `${hash}${path.extname(finalOriginalName)}`);

        const fileExistsOnDisk = await fs.pathExists(targetPath);

        if (!fileExistsOnDisk) {
            await fs.move(tempPath, targetPath, { overwrite: true });
            console.log(`[DatasetController] ✅ Saved new artifact to disk: ${targetPath}`);
        } else {
            await fs.remove(tempPath);
            console.log(`[DatasetController] ♻️ Deduped: Exact artifact already exists on disk.`);
        }

        // ==========================================
        // C. VERSIONING LOGIC
        // ==========================================
        let newVersion = 1;

        if (versionAction === 'NEW_VERSION') {
            const maxVer = await prisma.dataset.aggregate({
                where: { name: datasetName },
                _max: { version: true }
            });
            if (maxVer._max.version) {
                newVersion = maxVer._max.version + 1;
            }
        } else {
            const nameCheck = await prisma.dataset.findFirst({ where: { name: datasetName } });
            if (nameCheck) {
                return res.status(409).json({
                    error: `Dataset '${datasetName}' already exists. Use 'NEW_VERSION' or choose a different name.`
                });
            }
        }

        // ==========================================
        // D. DATABASE INSERTION
        // ==========================================
        const newDataset = await prisma.dataset.create({
            data: {
                name: datasetName,
                version: newVersion,
                filename: finalOriginalName,
                hash: hash,
                path: targetPath,
                sizeBytes: BigInt(finalSizeBytes),
                mimeType: finalMimeType
            }
        });

        console.log(`[DEBUG] ✅ Database record created: ID ${newDataset.id}`);

        res.status(201).json({
            success: true,
            message: "Dataset uploaded securely.",
            dataset: serializeDataset(newDataset)
        });

    } catch (error) {
        console.error(`[Upload] ❌ Error: ${error.message}`);
        console.error(error.stack);

        // Failsafe Cleanup: Delete temp path and any residual individual files
        if (tempPath && await fs.pathExists(tempPath)) await fs.remove(tempPath);
        if (files && files.length > 0) {
            for (const file of files) await fs.remove(file.path).catch(() => { });
        }

        res.status(500).json({ error: "Failed to process and upload dataset." });
    }
};

/**
 * 2. GET DIFF
 */
exports.diffDatasets = async (req, res) => {
    try {
        const { idA, idB } = req.query;
        console.log(`[DatasetController] Diff requested between ID: ${idA} and ID: ${idB}`);

        const [datasetA, datasetB] = await Promise.all([
            prisma.dataset.findUnique({ where: { id: idA } }),
            prisma.dataset.findUnique({ where: { id: idB } })
        ]);

        if (!datasetA || !datasetB) {
            console.warn(`[DatasetController] One or both datasets not found in DB.`);
            return res.status(404).json({ error: "Datasets not found" });
        }

        console.log(`[DatasetController] Path A: ${datasetA.path}`);
        console.log(`[DatasetController] Path B: ${datasetB.path}`);

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
        console.log(`[DatasetController] Download requested for ID: ${req.params.id}`);
        const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });

        if (!dataset) {
            console.warn(`[DatasetController] Dataset ID not found in DB`);
            return res.status(404).json({ error: "Dataset not found" });
        }

        console.log(`[DatasetController] Resolving file path: ${dataset.path}`);
        if (!await fs.pathExists(dataset.path)) {
            console.error(`[DatasetController] ❌ CRITICAL: File missing from disk at ${dataset.path}`);
            return res.status(500).json({ error: "File missing from disk (Integrity Error)" });
        }
        res.download(dataset.path, dataset.filename);
    } catch (error) {
        console.error(`[DatasetController] Download Error:`, error);
        res.status(500).json({ error: "Download failed" });
    }
};

/**
 * 6. DELETE
 */
exports.deleteDataset = async (req, res) => {
    const { id } = req.params;
    console.log(`[DatasetController] Delete requested for ID: ${id}`);

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
        console.log(`[DatasetController] Hash ${dataset.hash} is used by ${usageCount} records.`);

        if (usageCount <= 1) {
            // This is the last record using this file. Safe to delete from disk.
            if (await fs.pathExists(dataset.path)) {
                await fs.remove(dataset.path);
                console.log(`[DatasetController] 🗑️ Removed physical file: ${dataset.path}`);
            } else {
                console.warn(`[DatasetController] File was already missing from disk.`);
            }
        } else {
            console.log(`[DatasetController] 🔒 Skipped file deletion (Hash used by ${usageCount - 1} other versions).`);
        }

        await prisma.dataset.delete({ where: { id } });
        console.log(`[DatasetController] DB Record deleted.`);
        res.json({ success: true, message: "Dataset deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete dataset" });
    }
};