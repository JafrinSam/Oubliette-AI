const path = require('path');
const fs = require('fs-extra');
const prisma = require('../prisma');
const { calculateFileHash } = require('../utils/hashUtils');
const { compareDatasets } = require('../utils/csvDiff'); // Import the Diff Engine
const config = require('../config');

// Helper to handle BigInt for JSON
const serializeDataset = (d) => ({
    ...d,
    sizeBytes: d.sizeBytes.toString(),
    uploadedAt: d.uploadedAt.toISOString()
});

/**
 * 1. UPLOAD with VERSIONING
 */
exports.uploadDataset = async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded." });

    const { name, versionAction } = req.body;
    // versionAction: 'NEW_DATASET' | 'NEW_VERSION'

    const tempPath = file.path;

    try {
        // A. Calculate Hash
        const hash = await calculateFileHash(tempPath);

        // B. Check if this EXACT content already exists
        const existingContent = await prisma.dataset.findFirst({ where: { hash } });

        // C. Define Target Location
        const storageDir = path.resolve(process.cwd(), config.STORAGE_PATHS.DATASETS || 'storage/datasets');
        await fs.ensureDir(storageDir);
        const targetPath = path.join(storageDir, `${hash}${path.extname(file.originalname)}`);

        // If content is new, move it. If exists, we reuse the path.
        if (!existingContent) {
            await fs.move(tempPath, targetPath, { overwrite: true });
        } else {
            await fs.remove(tempPath); // Cleanup temp
        }

        // D. Determine Version
        let datasetName = name || "Untitled Dataset";
        let newVersion = 1;

        if (versionAction === 'NEW_VERSION') {
            // Find max version for this dataset name
            const maxVer = await prisma.dataset.aggregate({
                where: { name: datasetName },
                _max: { version: true }
            });

            if (maxVer._max.version) {
                newVersion = maxVer._max.version + 1;
            }
        } else {
            // Ensure unique name for NEW_DATASET if collision
            const nameCheck = await prisma.dataset.findFirst({ where: { name: datasetName } });
            if (nameCheck) {
                return res.status(409).json({
                    error: `Dataset '${datasetName}' already exists. Use 'NEW_VERSION' or choose a different name.`
                });
            }
        }

        // E. Create DB Record
        const newDataset = await prisma.dataset.create({
            data: {
                name: datasetName,
                version: newVersion,
                filename: file.originalname,
                hash: hash,
                path: targetPath,
                sizeBytes: BigInt(file.size),
                mimeType: file.mimetype
            }
        });

        res.status(201).json({
            success: true,
            message: "Dataset uploaded successfully",
            dataset: serializeDataset(newDataset)
        });

    } catch (error) {
        console.error(`[Upload] Error: ${error.message}`);
        if (await fs.pathExists(tempPath)) await fs.remove(tempPath);
        res.status(500).json({ error: "Failed to upload dataset" });
    }
};

/**
 * 2. GET DIFF: Compare two dataset versions
 */
exports.diffDatasets = async (req, res) => {
    try {
        const { idA, idB } = req.query; // Pass two IDs to compare

        const [datasetA, datasetB] = await Promise.all([
            prisma.dataset.findUnique({ where: { id: idA } }),
            prisma.dataset.findUnique({ where: { id: idB } })
        ]);

        if (!datasetA || !datasetB) {
            return res.status(404).json({ error: "One or both datasets not found" });
        }

        // Use our Diff Engine
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
        const datasets = await prisma.dataset.findMany({
            orderBy: { uploadedAt: 'desc' }
        });

        const serialized = datasets.map(serializeDataset);
        res.json(serialized);
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
        const dataset = await prisma.dataset.findUnique({
            where: { id: req.params.id }
        });

        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found" });
        }

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
        const dataset = await prisma.dataset.findUnique({
            where: { id: req.params.id }
        });

        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found" });
        }

        // Security Check: Ensure file exists
        if (!await fs.pathExists(dataset.path)) {
            return res.status(500).json({ error: "File missing from disk (Integrity Error)" });
        }

        // Send file with original filename
        res.download(dataset.path, dataset.filename);
    } catch (error) {
        res.status(500).json({ error: "Download failed" });
    }
};

/**
 * 6. DELETE
 */
exports.deleteDataset = async (req, res) => {
    const { id } = req.params;

    try {
        // A. Check if dataset exists
        const dataset = await prisma.dataset.findUnique({
            where: { id }
        });

        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found" });
        }

        // B. Delete File from Disk
        if (await fs.pathExists(dataset.path)) {
            await fs.remove(dataset.path);
            console.log(`[Delete] Removed file: ${dataset.path}`);
        } else {
            console.warn(`[Delete] File was already missing: ${dataset.path}`);
        }

        // C. Delete Record from DB
        await prisma.dataset.delete({
            where: { id }
        });

        res.json({ success: true, message: "Dataset deleted successfully" });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete dataset" });
    }
};
